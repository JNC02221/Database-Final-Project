import type { ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Invalid fine id" }, { status: 400 });
  const [result] = await pool.execute<ResultSetHeader>("UPDATE fines SET paid_status = ?, paid_date = CURRENT_DATE WHERE fine_id = ? AND paid_status = ?", ["PAID", id, "UNPAID"]);
  if (!result.affectedRows) return Response.json({ error: "Fine not found or already paid" }, { status: 404 });
  return Response.json({ success: true });
}
