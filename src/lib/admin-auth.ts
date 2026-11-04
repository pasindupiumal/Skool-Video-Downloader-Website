import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// Separate, standalone auth for the /admin panel — deliberately not tied to
// NextAuth or the regular users collection. Session is a signed, stateless
// cookie so it works from Route Handlers and Server Components alike.

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const ADMIN_SESSION_MAX_AGE = ADMIN_SESSION_TTL_MS / 1000;

function getSecret(): string {
  // No hardcoded fallback: a guessable secret would let anyone mint an admin
  // session cookie.
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || !expectedHash) return false;
  if (username !== expectedUsername) return false;

  return bcrypt.compare(password, expectedHash);
}

export function createAdminSessionToken(username: string): string {
  const payload = JSON.stringify({ u: username, exp: Date.now() + ADMIN_SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expectedSignature = sign(encoded);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (
    signatureBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(signatureBuf, expectedBuf)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    return typeof payload.exp === "number" && Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

// Shared guard for admin API Route Handlers — verifies the admin session
// cookie on the incoming request.
export function requireAdmin(request: NextRequest): boolean {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

// Generates a random, human-typeable temporary password for admin-mediated
// password resets (e.g. "K7m2-Qx9p-R4vT").
export function generateTemporaryPassword(): string {
  const part = () => crypto.randomBytes(3).toString("hex");
  return `${part()}-${part()}-${part()}`;
}
