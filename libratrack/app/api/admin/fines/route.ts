import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type FineRow = RowDataPacket & { fine_id: number; loan_id: number; member_name: string; book_title: string; amount: string; days_overdue: number; paid_status: "UNPAID" | "PAID"; paid_date: string | null };

export async function GET() {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const [fines] = await pool.execute<FineRow[]>(
    `SELECT f.fine_id, f.loan_id, u.full_name AS member_name, b.title AS book_title, f.amount, f.days_overdue, f.paid_status, f.paid_date
     FROM fines f INNER JOIN loans l ON l.loan_id = f.loan_id INNER JOIN users u ON u.user_id = l.user_id INNER JOIN books b ON b.book_id = l.book_id
     WHERE ? = ? ORDER BY f.paid_status = 'UNPAID' DESC, f.fine_id DESC`,
    [1, 1],
  );
  return Response.json({ fines });
}
