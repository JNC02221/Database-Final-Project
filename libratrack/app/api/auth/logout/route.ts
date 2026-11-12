import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return Response.json({ success: true });
}
