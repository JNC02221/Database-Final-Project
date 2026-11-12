import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type SummaryRow = RowDataPacket & {
  total_books: number;
  total_copies_available: string;
  active_loans: number;
  overdue_loans: number;
  unpaid_fines_total: string;
};
type LowStockRow = RowDataPacket & { book_id: number; title: string; available_copies: number; total_copies: number };
type OverdueRow = RowDataPacket & { loan_id: number; member_name: string; book_title: string; due_date: string; days_overdue: number };

export async function GET() {
  try {
    await requireRole("ADMIN");
  } catch (error) {
    return authErrorResponse(error);
  }

  const [rows] = await pool.execute<SummaryRow[]>(
    `SELECT
       (SELECT COUNT(*) FROM books) AS total_books,
       (SELECT COALESCE(SUM(available_copies), 0) FROM books) AS total_copies_available,
       (SELECT COUNT(*) FROM loans WHERE return_date IS NULL) AS active_loans,
       (SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date < CURRENT_DATE) AS overdue_loans,
       (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE paid_status = ?) AS unpaid_fines_total`,
    ["UNPAID"],
  );
  const [lowStock] = await pool.execute<LowStockRow[]>(
    "SELECT book_id, title, available_copies, total_copies FROM books WHERE available_copies <= ? ORDER BY available_copies, title LIMIT ?",
    [1, 10],
  );
  const [mostOverdue] = await pool.execute<OverdueRow[]>(
    `SELECT l.loan_id, u.full_name AS member_name, b.title AS book_title, l.due_date, DATEDIFF(CURRENT_DATE, l.due_date) AS days_overdue
     FROM loans l INNER JOIN users u ON u.user_id = l.user_id INNER JOIN books b ON b.book_id = l.book_id
     WHERE l.return_date IS NULL AND l.due_date < CURRENT_DATE ORDER BY l.due_date ASC LIMIT ?`,
    [5],
  );
  return Response.json({ ...rows[0], lowStock, mostOverdue });
}
