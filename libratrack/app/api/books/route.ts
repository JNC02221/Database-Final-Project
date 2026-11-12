import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type BookRow = RowDataPacket & {
  book_id: number;
  isbn: string;
  title: string;
  authors: string;
  category_name: string;
  publisher_name: string;
  total_copies: number;
  available_copies: number;
};
type CountRow = RowDataPacket & { total: number };

export async function GET(request: Request) {
  try {
    await requireRole();
  } catch (error) {
    return authErrorResponse(error);
  }

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const categoryValue = params.get("category") ?? "";
  const category = /^\d+$/.test(categoryValue) ? Number(categoryValue) : null;
  const availableOnly = params.get("availableOnly") === "true";
  const requestedPage = Number(params.get("page") ?? 1);
  const requestedPageSize = Number(params.get("pageSize") ?? 12);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isInteger(requestedPageSize)
    ? Math.min(50, Math.max(1, requestedPageSize))
    : 12;

  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(`(
      b.title LIKE ? OR b.isbn LIKE ? OR EXISTS (
        SELECT 1 FROM book_authors search_ba
        INNER JOIN authors search_a ON search_a.author_id = search_ba.author_id
        WHERE search_ba.book_id = b.book_id AND search_a.full_name LIKE ?
      )
    )`);
    values.push(like, like, like);
  }
  if (category !== null) {
    conditions.push("b.category_id = ?");
    values.push(category);
  }
  if (availableOnly) {
    conditions.push("b.available_copies > ?");
    values.push(0);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM books b ${where}`,
    values,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const offset = (page - 1) * pageSize;
  const [books] = await pool.execute<BookRow[]>(
    `SELECT b.book_id, b.isbn, b.title,
            GROUP_CONCAT(DISTINCT a.full_name ORDER BY a.full_name SEPARATOR ', ') AS authors,
            c.name AS category_name, p.name AS publisher_name,
            b.total_copies, b.available_copies
     FROM books b
     INNER JOIN categories c ON c.category_id = b.category_id
     INNER JOIN publishers p ON p.publisher_id = b.publisher_id
     LEFT JOIN book_authors ba ON ba.book_id = b.book_id
     LEFT JOIN authors a ON a.author_id = ba.author_id
     ${where}
     GROUP BY b.book_id, b.isbn, b.title, c.name, p.name, b.total_copies, b.available_copies
     ORDER BY b.title ASC
     LIMIT ? OFFSET ?`,
    [...values, pageSize, offset],
  );

  return Response.json({ books, total, page, pageSize });
}
