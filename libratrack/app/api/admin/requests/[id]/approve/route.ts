import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type RequestRow = RowDataPacket & { user_id: number; book_id: number; status: string; expires_on: string | null; expired: number };

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  let adminId: number; try { adminId = (await requireRole("ADMIN")).userId; } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Request not found" }, { status: 404 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RequestRow[]>(`SELECT user_id, book_id, status, expires_on, (expires_on IS NOT NULL AND expires_on < CURRENT_TIMESTAMP) AS expired FROM reservations WHERE reservation_id = ? FOR UPDATE`, [id]);
    const reservation = rows[0];
    if (!reservation) { await connection.rollback(); return Response.json({ error: "Request not found" }, { status: 404 }); }
    if (!['PENDING', 'READY'].includes(reservation.status)) { await connection.rollback(); return Response.json({ error: "Only pending or ready requests can be approved" }, { status: 400 }); }
    if (reservation.status === "READY" && Number(reservation.expired) === 1) { await connection.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE reservation_id = ?", ["EXPIRED", id]); await connection.commit(); return Response.json({ error: "This ready request has expired" }, { status: 400 }); }
    try { await connection.execute("CALL sp_issue_book(?, ?, ?)", [reservation.user_id, reservation.book_id, adminId]); }
    catch (error) {
      await connection.rollback(); const databaseError = error as { sqlState?: string; errno?: number; sqlMessage?: string; message?: string };
      if (databaseError.sqlState === "45000" || databaseError.errno === 1644) return Response.json({ error: databaseError.sqlMessage ?? databaseError.message ?? "The request could not be approved" }, { status: 400 });
      throw error;
    }
    await connection.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE reservation_id = ? AND status IN (?, ?)", ["FULFILLED", id, "PENDING", "READY"]);
    await connection.commit(); return Response.json({ success: true });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
