import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "libratrack_session";

export type Role = "ADMIN" | "MEMBER";

export type Session = {
  userId: number;
  role: Role;
  name: string;
};

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("Missing required environment variable: JWT_SECRET");
  return new TextEncoder().encode(value);
}

export async function signToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "number" ||
      (payload.role !== "ADMIN" && payload.role !== "MEMBER") ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function requireRole(role?: Role): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Authentication required");
  if (role && session.role !== role) {
    throw new AuthError(403, "You do not have permission to access this resource");
  }
  return session;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
