import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type UserRow = RowDataPacket & { status: "ACTIVE" | "SUSPENDED" };
type BookRow = RowDataPacket & { available_copies: number };
type CountRow = RowDataPacket & { total: number };
type RequestRow = RowDataPacket & { reservation_id: number; book_id: number; title: string; status: "PENDING" | "READY" | "FULFILLED" | "CANCELLED" | "EXPIRED"; reserved_on: string; expires_on: string | null };

export async function GET() {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  await pool.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE user_id = ? AND status = ? AND expires_on IS NOT NULL AND expires_on < CURRENT_TIMESTAMP", ["EXPIRED", userId, "READY"]);
  const [requests] = await pool.execute<RequestRow[]>(
    `SELECT r.reservation_id, r.book_id, b.title, r.status, r.reserved_on, r.expires_on
     FROM reservations r INNER JOIN books b ON b.book_id = r.book_id
     WHERE r.user_id = ? ORDER BY r.reserved_on DESC`,
    [userId],
  );
  return Response.json({ requests });
}

export async function POST(request: Request) {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const bookId = Number(body.bookId); if (!Number.isInteger(bookId) || bookId < 1) return Response.json({ error: "Select a valid book" }, { status: 400 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<UserRow[]>("SELECT status FROM users WHERE user_id = ? AND role = ? FOR UPDATE", [userId, "MEMBER"]);
    if (!users[0] || users[0].status !== "ACTIVE") { await connection.rollback(); return Response.json({ error: "Your member account must be active to request books" }, { status: 400 }); }
    const [books] = await connection.execute<BookRow[]>("SELECT available_copies FROM books WHERE book_id = ?", [bookId]);
    if (!books[0]) { await connection.rollback(); return Response.json({ error: "Book not found" }, { status: 400 }); }
    const [activeLoan] = await connection.execute<CountRow[]>("SELECT COUNT(*) AS total FROM loans WHERE user_id = ? AND book_id = ? AND return_date IS NULL", [userId, bookId]);
    if (Number(activeLoan[0].total) > 0) { await connection.rollback(); return Response.json({ error: "You already have this book on loan" }, { status: 409 }); }
    const [duplicate] = await connection.execute<CountRow[]>("SELECT COUNT(*) AS total FROM reservations WHERE user_id = ? AND book_id = ? AND status IN (?, ?)", [userId, bookId, "PENDING", "READY"]);
    if (Number(duplicate[0].total) > 0) { await connection.rollback(); return Response.json({ error: "You already have an open request for this book" }, { status: 409 }); }
    const [open] = await connection.execute<CountRow[]>("SELECT COUNT(*) AS total FROM reservations WHERE user_id = ? AND status IN (?, ?)", [userId, "PENDING", "READY"]);
    if (Number(open[0].total) >= 5) { await connection.rollback(); return Response.json({ error: "You can have at most 5 open book requests" }, { status: 409 }); }
    const [fines] = await connection.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM fines f INNER JOIN loans l ON l.loan_id = f.loan_id WHERE l.user_id = ? AND f.paid_status = ?`, [userId, "UNPAID"]);
    if (Number(fines[0].total) > 0) { await connection.rollback(); return Response.json({ error: "You cannot request books while you have unpaid fines" }, { status: 400 }); }
    const [result] = await connection.execute<ResultSetHeader>("INSERT INTO reservations (user_id, book_id, reserved_on, status) VALUES (?, ?, CURRENT_TIMESTAMP, ?)", [userId, bookId, "PENDING"]);
    await connection.commit();
    const available = books[0].available_copies > 0;
    return Response.json({ requestId: result.insertId, available, waitingList: !available }, { status: 201 });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
