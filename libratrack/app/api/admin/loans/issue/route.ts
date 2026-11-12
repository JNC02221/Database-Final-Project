import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  let adminId: number; try { adminId = (await requireRole("ADMIN")).userId; } catch (error) { return authErrorResponse(error); }
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const userId = Number(body.userId); const bookId = Number(body.bookId);
  if (!Number.isInteger(userId) || userId < 1 || !Number.isInteger(bookId) || bookId < 1) return Response.json({ error: "Select a valid member and book" }, { status: 400 });
  try {
    await pool.execute("CALL sp_issue_book(?, ?, ?)", [userId, bookId, adminId]);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    const databaseError = error as { sqlState?: string; errno?: number; sqlMessage?: string; message?: string };
    if (databaseError.sqlState === "45000" || databaseError.errno === 1644) return Response.json({ error: databaseError.sqlMessage ?? databaseError.message ?? "The book could not be issued" }, { status: 400 });
    throw error;
  }
}
