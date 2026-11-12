import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type FineRow = RowDataPacket & { amount: string };

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const loanId = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!loanId) return Response.json({ error: "Invalid loan id" }, { status: 400 });
  try {
    await pool.execute("CALL sp_return_book(?)", [loanId]);
    const [fines] = await pool.execute<FineRow[]>("SELECT amount FROM fines WHERE loan_id = ? ORDER BY fine_id DESC LIMIT ?", [loanId, 1]);
    return Response.json({ success: true, fineAmount: fines[0]?.amount ?? "0.00" });
  } catch (error) {
    const databaseError = error as { sqlState?: string; errno?: number; sqlMessage?: string; message?: string };
    if (databaseError.sqlState === "45000" || databaseError.errno === 1644) return Response.json({ error: databaseError.sqlMessage ?? databaseError.message ?? "The book could not be returned" }, { status: 400 });
    throw error;
  }
}
