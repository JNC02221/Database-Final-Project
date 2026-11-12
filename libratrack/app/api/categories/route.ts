import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { authErrorResponse, requireRole } from "@/lib/auth";

type CategoryRow = RowDataPacket & { category_id: number; name: string };

export async function GET() {
  try {
    await requireRole();
  } catch (error) {
    return authErrorResponse(error);
  }

  const [categories] = await pool.execute<CategoryRow[]>(
    "SELECT category_id, name FROM categories ORDER BY name ASC",
    [],
  );
  return Response.json({ categories });
}
