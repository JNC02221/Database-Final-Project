import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type LoanRow = RowDataPacket & {
  loan_id: number;
  title: string;
  isbn: string;
  issue_date: string;
  due_date: string;
  status: "ISSUED" | "OVERDUE";
  unpaid_fines: string;
};

export async function GET() {
  let userId: number;
  try {
    userId = (await requireRole("MEMBER")).userId;
  } catch (error) {
    return authErrorResponse(error);
  }

  const [loans] = await pool.execute<LoanRow[]>(
    `SELECT l.loan_id, b.title, b.isbn, l.issue_date, l.due_date, l.status,
            COALESCE(SUM(CASE WHEN f.paid_status = ? THEN f.amount ELSE 0 END), 0) AS unpaid_fines
     FROM loans l
     INNER JOIN books b ON b.book_id = l.book_id
     LEFT JOIN fines f ON f.loan_id = l.loan_id
     WHERE l.user_id = ? AND l.return_date IS NULL
     GROUP BY l.loan_id, b.title, b.isbn, l.issue_date, l.due_date, l.status
     ORDER BY l.due_date ASC`,
    ["UNPAID", userId],
  );
  return Response.json({ loans });
}
