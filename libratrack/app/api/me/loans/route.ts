import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type LoanRow = RowDataPacket & { loan_id: number; book_id: number; title: string; isbn: string; issue_date: string; due_date: string; return_date: string | null };
type FineRow = RowDataPacket & { fine_id: number; loan_id: number; title: string; amount: string; days_overdue: number; paid_status: "UNPAID" | "PAID"; paid_date: string | null };

export async function GET() {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  const [currentLoans] = await pool.execute<LoanRow[]>(`SELECT l.loan_id, l.book_id, b.title, b.isbn, l.issue_date, l.due_date, l.return_date FROM loans l INNER JOIN books b ON b.book_id = l.book_id WHERE l.user_id = ? AND l.return_date IS NULL ORDER BY l.due_date`, [userId]);
  const [history] = await pool.execute<LoanRow[]>(`SELECT l.loan_id, l.book_id, b.title, b.isbn, l.issue_date, l.due_date, l.return_date FROM loans l INNER JOIN books b ON b.book_id = l.book_id WHERE l.user_id = ? AND l.return_date IS NOT NULL ORDER BY l.return_date DESC`, [userId]);
  const [fines] = await pool.execute<FineRow[]>(`SELECT f.fine_id, f.loan_id, b.title, f.amount, f.days_overdue, f.paid_status, f.paid_date FROM fines f INNER JOIN loans l ON l.loan_id = f.loan_id INNER JOIN books b ON b.book_id = l.book_id WHERE l.user_id = ? ORDER BY f.fine_id DESC`, [userId]);
  return Response.json({ currentLoans, history, unpaidFines: fines.filter((fine) => fine.paid_status === "UNPAID"), paidFines: fines.filter((fine) => fine.paid_status === "PAID") });
}
