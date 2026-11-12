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
  return Response.json(rows[0]);
}
