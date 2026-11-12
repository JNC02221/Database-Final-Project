import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";
import { findOrCreateNamed, parseBookInput, replaceBookAuthors } from "@/lib/admin-books";

type LockedBook = RowDataPacket & { total_copies: number; available_copies: number };
type CountRow = RowDataPacket & { total: number };

function idFrom(value: string) { return /^\d+$/.test(value) ? Number(value) : null; }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const id = idFrom((await context.params).id); if (!id) return Response.json({ error: "Invalid book id" }, { status: 400 });
  let body: unknown; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const parsed = parseBookInput(body); if (!parsed.data) return Response.json({ error: parsed.error }, { status: 400 });
  const book = parsed.data; const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [locked] = await connection.execute<LockedBook[]>("SELECT total_copies, available_copies FROM books WHERE book_id = ? FOR UPDATE", [id]);
    if (!locked[0]) { await connection.rollback(); return Response.json({ error: "Book not found" }, { status: 404 }); }
    const onLoan = locked[0].total_copies - locked[0].available_copies;
    if (book.total_copies < onLoan) { await connection.rollback(); return Response.json({ error: `Total copies cannot be less than the ${onLoan} currently on loan` }, { status: 400 }); }
    const available = book.total_copies - onLoan;
    const categoryId = await findOrCreateNamed(connection, "categories", "category_id", book.category);
    const publisherId = await findOrCreateNamed(connection, "publishers", "publisher_id", book.publisher);
    await connection.execute<ResultSetHeader>(
      `UPDATE books SET isbn = ?, title = ?, publisher_id = ?, category_id = ?, edition = ?, publication_year = ?, language = ?, shelf_location = ?, total_copies = ?, available_copies = ? WHERE book_id = ?`,
      [book.isbn, book.title, publisherId, categoryId, book.edition, book.publication_year, book.language, book.shelf_location, book.total_copies, available, id],
    );
    await replaceBookAuthors(connection, id, book.authors); await connection.commit(); return Response.json({ success: true });
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return Response.json({ error: "A book with this ISBN already exists" }, { status: 409 });
    throw error;
  } finally { connection.release(); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const id = idFrom((await context.params).id); if (!id) return Response.json({ error: "Invalid book id" }, { status: 400 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [dependencies] = await connection.execute<CountRow[]>(`SELECT (SELECT COUNT(*) FROM loans WHERE book_id = ?) + (SELECT COUNT(*) FROM reservations WHERE book_id = ?) AS total`, [id, id]);
    if (Number(dependencies[0]?.total) > 0) { await connection.rollback(); return Response.json({ error: "This book has borrowing history and cannot be deleted" }, { status: 409 }); }
    await connection.execute<ResultSetHeader>("DELETE FROM book_authors WHERE book_id = ?", [id]);
    const [result] = await connection.execute<ResultSetHeader>("DELETE FROM books WHERE book_id = ?", [id]);
    if (!result.affectedRows) { await connection.rollback(); return Response.json({ error: "Book not found" }, { status: 404 }); }
    await connection.commit(); return Response.json({ success: true });
  } catch (error) { await connection.rollback(); if ((error as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") return Response.json({ error: "This book has borrowing history and cannot be deleted" }, { status: 409 }); throw error; }
  finally { connection.release(); }
}
