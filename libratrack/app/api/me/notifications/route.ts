import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type LoanNotice = RowDataPacket & { loan_id: number; title: string; days_until_due: number };
type FineTotal = RowDataPacket & { total: string };
type ReadyNotice = RowDataPacket & { reservation_id: number; title: string; expires_on: string | null };

export async function GET() {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  await pool.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE user_id = ? AND status = ? AND expires_on IS NOT NULL AND expires_on < CURRENT_TIMESTAMP", ["EXPIRED", userId, "READY"]);
  const [loans] = await pool.execute<LoanNotice[]>(`SELECT l.loan_id, b.title, DATEDIFF(l.due_date, CURRENT_DATE) AS days_until_due FROM loans l INNER JOIN books b ON b.book_id = l.book_id WHERE l.user_id = ? AND l.return_date IS NULL AND l.due_date <= DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY) ORDER BY l.due_date`, [userId]);
  const [fineRows] = await pool.execute<FineTotal[]>(`SELECT COALESCE(SUM(f.amount), 0) AS total FROM fines f INNER JOIN loans l ON l.loan_id = f.loan_id WHERE l.user_id = ? AND f.paid_status = ?`, [userId, "UNPAID"]);
  const [ready] = await pool.execute<ReadyNotice[]>(`SELECT r.reservation_id, b.title, r.expires_on FROM reservations r INNER JOIN books b ON b.book_id = r.book_id WHERE r.user_id = ? AND r.status = ? ORDER BY r.expires_on`, [userId, "READY"]);
  const items: Array<{ id: string; type: string; severity: "info" | "warning" | "urgent"; message: string; link?: string }> = loans.map((loan) => ({ id: `loan-${loan.loan_id}`, type: "loan", severity: loan.days_until_due <= 0 ? "urgent" : "warning", message: loan.days_until_due < 0 ? `“${loan.title}” is overdue by ${Math.abs(loan.days_until_due)} day${Math.abs(loan.days_until_due) === 1 ? "" : "s"}.` : loan.days_until_due === 0 ? `“${loan.title}” is due today.` : `“${loan.title}” is due in ${loan.days_until_due} day${loan.days_until_due === 1 ? "" : "s"}.`, link: "/account" }));
  const fineTotal = Number(fineRows[0]?.total ?? 0); if (fineTotal > 0) items.push({ id: "unpaid-fines", type: "fine", severity: "urgent", message: `You have $${fineTotal.toFixed(2)} in unpaid fines.`, link: "/account" });
  for (const request of ready) items.push({ id: `request-${request.reservation_id}`, type: "request", severity: "info", message: request.expires_on ? `“${request.title}” is ready for pickup until ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(request.expires_on))}.` : `“${request.title}” is ready for pickup.`, link: "/account" });
  return Response.json({ notifications: items, count: items.length });
}
