import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "admin_session";

// In production, fallback to a runtime-generated 256-bit random key if not configured,
// ensuring no attacker can use the public repo string to forge admin JWT sessions.
const fallbackSecret =
  process.env.NODE_ENV === "production"
    ? crypto.randomBytes(32).toString("hex")
    : "aboutme-super-secure-secret-key-must-be-changed-in-production-2026";

const SECRET_KEY = process.env.SESSION_SECRET || fallbackSecret;
const encodedSecret = new TextEncoder().encode(SECRET_KEY);

export interface AdminSessionUser {
  username: string;
  name?: string;
  avatarUrl?: string;
  role: "admin";
}

export async function createSession(user: AdminSessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function getSession(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return {
      username: payload.username as string,
      name: payload.name as string | undefined,
      avatarUrl: payload.avatarUrl as string | undefined,
      role: "admin",
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
