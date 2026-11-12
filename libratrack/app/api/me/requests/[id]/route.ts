import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type StatusRow = RowDataPacket & { status: string };

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Request not found" }, { status: 404 });
  const [result] = await pool.execute<ResultSetHeader>("UPDATE reservations SET status = ? WHERE reservation_id = ? AND user_id = ? AND status IN (?, ?)", ["CANCELLED", id, userId, "PENDING", "READY"]);
  if (result.affectedRows) return Response.json({ success: true });
  const [owned] = await pool.execute<StatusRow[]>("SELECT status FROM reservations WHERE reservation_id = ? AND user_id = ? LIMIT ?", [id, userId, 1]);
  if (!owned[0]) return Response.json({ error: "Request not found" }, { status: 404 });
  return Response.json({ error: "Only pending or ready requests can be cancelled" }, { status: 400 });
}
