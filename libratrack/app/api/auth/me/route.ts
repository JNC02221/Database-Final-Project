import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  return Response.json(session);
}
