import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type LoanRow = RowDataPacket & { loan_id: number; title: string; isbn: string; issue_date: string; due_date: string; return_date: string | null; status: string; fine_amount: string; paid_status: string | null; days_overdue: number | null };

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Invalid member id" }, { status: 400 });
  const [loans] = await pool.execute<LoanRow[]>(
    `SELECT l.loan_id, b.title, b.isbn, l.issue_date, l.due_date, l.return_date,
            CASE WHEN l.return_date IS NULL AND l.due_date < CURRENT_DATE THEN 'OVERDUE' ELSE l.status END AS status,
            COALESCE(SUM(f.amount), 0) AS fine_amount,
            CASE WHEN SUM(f.paid_status = 'UNPAID') > 0 THEN 'UNPAID' WHEN COUNT(f.fine_id) > 0 THEN 'PAID' ELSE NULL END AS paid_status,
            MAX(f.days_overdue) AS days_overdue
     FROM loans l INNER JOIN books b ON b.book_id = l.book_id LEFT JOIN fines f ON f.loan_id = l.loan_id
     WHERE l.user_id = ? GROUP BY l.loan_id, b.title, b.isbn, l.issue_date, l.due_date, l.return_date, l.status ORDER BY l.issue_date DESC`,
    [id],
  );
  return Response.json({ loans });
}
