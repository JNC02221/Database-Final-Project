import type { ResultSetHeader } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let adminId: number; try { adminId = (await requireRole("ADMIN")).userId; } catch (error) { return authErrorResponse(error); }
  const rawId = (await context.params).id; const id = /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!id) return Response.json({ error: "Invalid member id" }, { status: 400 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) || null : null;
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 255) || null : null;
  const status = body.status;
  if (!fullName || fullName.length > 150) return Response.json({ error: "Full name is required and must be 150 characters or fewer" }, { status: 400 });
  if (status !== "ACTIVE" && status !== "SUSPENDED") return Response.json({ error: "Status must be ACTIVE or SUSPENDED" }, { status: 400 });
  if (id === adminId && status === "SUSPENDED") return Response.json({ error: "An administrator cannot suspend their own account" }, { status: 400 });
  const [result] = await pool.execute<ResultSetHeader>(`UPDATE users SET full_name = ?, phone = ?, address = ?, status = ? WHERE user_id = ? AND role = ?`, [fullName, phone, address, status, id, "MEMBER"]);
  if (!result.affectedRows) return Response.json({ error: "Member not found" }, { status: 404 });
  return Response.json({ success: true });
}
