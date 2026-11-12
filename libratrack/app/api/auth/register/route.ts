import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";

type ExistingUserRow = RowDataPacket & { user_id: number };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { full_name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || fullName.length > 150) {
    return Response.json({ error: "Full name is required and must be 150 characters or fewer" }, { status: 400 });
  }
  if (!emailPattern.test(email) || email.length > 255) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const [existing] = await pool.execute<ExistingUserRow[]>(
    "SELECT user_id FROM users WHERE email = ? LIMIT ?",
    [email, 1],
  );
  if (existing.length > 0) {
    return Response.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, "MEMBER", "ACTIVE"],
    );
  } catch (error) {
    const duplicate = error as { code?: string };
    if (duplicate.code === "ER_DUP_ENTRY") {
      return Response.json({ error: "An account with that email already exists" }, { status: 409 });
    }
    throw error;
  }

  return Response.json({ message: "Account created" }, { status: 201 });
}
