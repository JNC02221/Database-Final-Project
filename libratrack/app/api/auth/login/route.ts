import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { SESSION_COOKIE, signToken, type Role } from "@/lib/auth";

type UserRow = RowDataPacket & {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
};

const INVALID_CREDENTIALS = "Invalid email or password";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return Response.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT user_id, full_name, email, password_hash, role, status
     FROM users
     WHERE email = ?
     LIMIT ?`,
    [body.email.trim().toLowerCase(), 1],
  );
  const user = rows[0];
  const valid = user ? await bcrypt.compare(body.password, user.password_hash) : false;

  if (!user || !valid) {
    return Response.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }
  if (user.status === "SUSPENDED") {
    return Response.json({ error: "This account is suspended" }, { status: 403 });
  }

  const token = await signToken({
    userId: user.user_id,
    role: user.role,
    name: user.full_name,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ role: user.role, name: user.full_name });
}
