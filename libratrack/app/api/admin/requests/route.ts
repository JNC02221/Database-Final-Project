import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type RequestRow = RowDataPacket & { reservation_id: number; user_id: number; member_name: string; book_id: number; book_title: string; available_copies: number; status: string; reserved_on: string; expires_on: string | null };

export async function GET(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const requested = new URL(request.url).searchParams.get("status") ?? "all";
  const statuses = ["PENDING", "READY", "FULFILLED", "CANCELLED", "EXPIRED"];
  const status = statuses.includes(requested.toUpperCase()) ? requested.toUpperCase() : "all";
  const where = status === "all" ? "" : "AND r.status = ?";
  const values = status === "all" ? [1, 1] : [1, 1, status];
  const [requests] = await pool.execute<RequestRow[]>(
    `SELECT r.reservation_id, r.user_id, u.full_name AS member_name, r.book_id, b.title AS book_title,
            b.available_copies, r.status, r.reserved_on, r.expires_on
     FROM reservations r INNER JOIN users u ON u.user_id = r.user_id INNER JOIN books b ON b.book_id = r.book_id
     WHERE ? = ? ${where} ORDER BY r.reserved_on ASC`,
    values,
  );
  return Response.json({ requests, status });
}
