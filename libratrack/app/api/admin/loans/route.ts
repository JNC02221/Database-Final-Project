import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type LoanRow = RowDataPacket & { loan_id: number; user_id: number; member_name: string; book_id: number; book_title: string; issue_date: string; due_date: string; return_date: string | null; computed_status: "ACTIVE" | "OVERDUE" | "RETURNED"; fine_amount: string; fine_status: string | null };

export async function GET(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const requested = new URL(request.url).searchParams.get("filter") ?? "all";
  const filter = ["all", "active", "overdue", "returned"].includes(requested) ? requested : "all";
  const clauses: Record<string, string> = {
    all: "", active: "AND l.return_date IS NULL", overdue: "AND l.return_date IS NULL AND l.due_date < CURRENT_DATE", returned: "AND l.return_date IS NOT NULL",
  };
  const [loans] = await pool.execute<LoanRow[]>(
    `SELECT l.loan_id, l.user_id, u.full_name AS member_name, l.book_id, b.title AS book_title,
            l.issue_date, l.due_date, l.return_date,
            CASE WHEN l.return_date IS NOT NULL THEN 'RETURNED' WHEN l.due_date < CURRENT_DATE THEN 'OVERDUE' ELSE 'ACTIVE' END AS computed_status,
            COALESCE(SUM(f.amount), 0) AS fine_amount,
            CASE WHEN SUM(f.paid_status = 'UNPAID') > 0 THEN 'UNPAID' WHEN COUNT(f.fine_id) > 0 THEN 'PAID' ELSE NULL END AS fine_status
     FROM loans l INNER JOIN users u ON u.user_id = l.user_id INNER JOIN books b ON b.book_id = l.book_id LEFT JOIN fines f ON f.loan_id = l.loan_id
     WHERE ? = ? ${clauses[filter]}
     GROUP BY l.loan_id, l.user_id, u.full_name, l.book_id, b.title, l.issue_date, l.due_date, l.return_date
     ORDER BY l.return_date IS NULL DESC, l.due_date ASC`,
    [1, 1],
  );
  return Response.json({ loans, filter });
}
