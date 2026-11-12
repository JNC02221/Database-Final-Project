import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { findOrCreateNamed, parseBookInput, replaceBookAuthors } from "@/lib/admin-books";

type BookRow = RowDataPacket & { book_id: number; isbn: string; title: string; authors: string; category_name: string; publisher_name: string; edition: string | null; publication_year: number | null; language: string; shelf_location: string; total_copies: number; available_copies: number };
type CountRow = RowDataPacket & { total: number };

export async function GET(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const requestedPage = Number(params.get("page") ?? 1); const requestedSize = Number(params.get("pageSize") ?? 15);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isInteger(requestedSize) ? Math.min(50, Math.max(1, requestedSize)) : 15;
  const values: Array<string | number> = [];
  const where = q ? `WHERE b.title LIKE ? OR b.isbn LIKE ? OR EXISTS (SELECT 1 FROM book_authors sba INNER JOIN authors sa ON sa.author_id = sba.author_id WHERE sba.book_id = b.book_id AND sa.full_name LIKE ?)` : "";
  if (q) { const like = `%${q}%`; values.push(like, like, like); }
  const [countRows] = await pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM books b ${where}`, values);
  const [books] = await pool.execute<BookRow[]>(
    `SELECT b.book_id, b.isbn, b.title, GROUP_CONCAT(DISTINCT a.full_name ORDER BY a.full_name SEPARATOR ', ') AS authors,
            c.name AS category_name, p.name AS publisher_name, b.edition, b.publication_year, b.language,
            b.shelf_location, b.total_copies, b.available_copies
     FROM books b INNER JOIN categories c ON c.category_id = b.category_id INNER JOIN publishers p ON p.publisher_id = b.publisher_id
     LEFT JOIN book_authors ba ON ba.book_id = b.book_id LEFT JOIN authors a ON a.author_id = ba.author_id
     ${where} GROUP BY b.book_id, b.isbn, b.title, c.name, p.name, b.edition, b.publication_year, b.language, b.shelf_location, b.total_copies, b.available_copies
     ORDER BY b.title LIMIT ? OFFSET ?`,
    [...values, pageSize, (page - 1) * pageSize],
  );
  return Response.json({ books, total: Number(countRows[0]?.total ?? 0), page, pageSize });
}

export async function POST(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  let body: unknown; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const parsed = parseBookInput(body); if (!parsed.data) return Response.json({ error: parsed.error }, { status: 400 });
  const book = parsed.data; const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const categoryId = await findOrCreateNamed(connection, "categories", "category_id", book.category);
    const publisherId = await findOrCreateNamed(connection, "publishers", "publisher_id", book.publisher);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO books (isbn, title, publisher_id, category_id, edition, publication_year, language, shelf_location, total_copies, available_copies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [book.isbn, book.title, publisherId, categoryId, book.edition, book.publication_year, book.language, book.shelf_location, book.total_copies, book.total_copies],
    );
    await replaceBookAuthors(connection, result.insertId, book.authors);
    await connection.commit(); return Response.json({ bookId: result.insertId }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return Response.json({ error: "A book with this ISBN already exists" }, { status: 409 });
    throw error;
  } finally { connection.release(); }
}
