import { cookies } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole, SESSION_COOKIE, signToken } from "@/lib/auth";

type ProfileRow = RowDataPacket & { full_name: string; email: string; phone: string | null; address: string | null; status: string; created_at: string };

export async function GET() {
  let userId: number; try { userId = (await requireRole("MEMBER")).userId; } catch (error) { return authErrorResponse(error); }
  const [rows] = await pool.execute<ProfileRow[]>("SELECT full_name, email, phone, address, status, created_at FROM users WHERE user_id = ? AND role = ? LIMIT ?", [userId, "MEMBER", 1]);
  if (!rows[0]) return Response.json({ error: "Profile not found" }, { status: 404 });
  return Response.json({ profile: rows[0] });
}

export async function PATCH(request: Request) {
  let session; try { session = await requireRole("MEMBER"); } catch (error) { return authErrorResponse(error); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) || null : null;
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 255) || null : null;
  if (!fullName || fullName.length > 150) return Response.json({ error: "Full name is required and must be 150 characters or fewer" }, { status: 400 });
  const [result] = await pool.execute<ResultSetHeader>("UPDATE users SET full_name = ?, phone = ?, address = ? WHERE user_id = ? AND role = ?", [fullName, phone, address, session.userId, "MEMBER"]);
  if (!result.affectedRows) return Response.json({ error: "Profile not found" }, { status: 404 });
  const token = await signToken({ ...session, name: fullName });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8, secure: process.env.NODE_ENV === "production" });
  return Response.json({ success: true, name: fullName });
}
