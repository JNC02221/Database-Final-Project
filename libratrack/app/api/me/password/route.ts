import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type PasswordRow = RowDataPacket & { password_hash: string };

export async function POST(request: Request) {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 8) return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  const [rows] = await pool.execute<PasswordRow[]>("SELECT password_hash FROM users WHERE user_id = ? AND role = ? LIMIT ?", [userId, "MEMBER", 1]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.execute<ResultSetHeader>("UPDATE users SET password_hash = ? WHERE user_id = ? AND role = ?", [hash, userId, "MEMBER"]);
  return Response.json({ success: true });
}
