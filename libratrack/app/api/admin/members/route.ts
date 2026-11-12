import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type MemberRow = RowDataPacket & { user_id: number; full_name: string; email: string; phone: string | null; address: string | null; status: "ACTIVE" | "SUSPENDED"; created_at: string; active_loans: number; unpaid_fines_total: string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? ""; const values: string[] = ["MEMBER"];
  const search = q ? "AND (u.full_name LIKE ? OR u.email LIKE ?)" : "";
  if (q) { values.push(`%${q}%`, `%${q}%`); }
  const [members] = await pool.execute<MemberRow[]>(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.address, u.status, u.created_at,
            COUNT(DISTINCT CASE WHEN l.return_date IS NULL THEN l.loan_id END) AS active_loans,
            COALESCE(SUM(CASE WHEN f.paid_status = 'UNPAID' THEN f.amount ELSE 0 END), 0) AS unpaid_fines_total
     FROM users u LEFT JOIN loans l ON l.user_id = u.user_id LEFT JOIN fines f ON f.loan_id = l.loan_id
     WHERE u.role = ? ${search}
     GROUP BY u.user_id, u.full_name, u.email, u.phone, u.address, u.status, u.created_at ORDER BY u.full_name`,
    values,
  );
  return Response.json({ members });
}

export async function POST(request: Request) {
  try { await requireRole("ADMIN"); } catch (error) { return authErrorResponse(error); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) || null : null;
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 255) || null : null;
  if (!fullName || fullName.length > 150) return Response.json({ error: "Full name is required and must be 150 characters or fewer" }, { status: 400 });
  if (!emailPattern.test(email) || email.length > 255) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  const hash = await bcrypt.hash(password, 12);
  try {
    const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO users (full_name, email, password_hash, role, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [fullName, email, hash, "MEMBER", phone, address, "ACTIVE"]);
    return Response.json({ userId: result.insertId }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return Response.json({ error: "An account with that email already exists" }, { status: 409 });
    throw error;
  }
}
