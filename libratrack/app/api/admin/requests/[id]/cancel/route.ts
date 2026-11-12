import type { ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Request not found" }, { status: 404 });
  const [result] = await pool.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE reservation_id = ? AND status IN (?, ?)", ["CANCELLED", id, "PENDING", "READY"]);
  if (!result.affectedRows) return Response.json({ error: "Request not found or no longer open" }, { status: 404 });
  return Response.json({ success: true });
}
