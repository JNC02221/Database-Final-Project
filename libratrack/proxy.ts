import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value ?? "");
  const path = request.nextUrl.pathname;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (path.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/catalogue", request.url));
  }
  if (path.startsWith("/account") && session.role !== "MEMBER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (path.startsWith("/notifications") && session.role !== "MEMBER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/catalogue/:path*", "/account/:path*", "/notifications/:path*", "/admin/:path*"],
};
