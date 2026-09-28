import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless signed-cookie sessions (no Redis / server-side session store —
 * this app runs on shared hosting without Redis). The token is
 * base64url(payload) + "." + HMAC-SHA256 signature, so a route can verify
 * it synchronously with no DB/cache round-trip. Logout simply deletes the
 * cookie client-side; a stolen token stays valid until it expires (8h).
 */

export const SESSION_COOKIE = "mef_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is required");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export async function createSession(adminId: string, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ adminId, email, exp })).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export async function getSession(
  token: string | undefined
): Promise<{ adminId: string; email: string } | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof data.adminId !== "string" || typeof data.email !== "string") return null;
    return { adminId: data.adminId, email: data.email };
  } catch {
    return null;
  }
}

export async function destroySession(_token: string | undefined): Promise<void> {
  // Stateless — nothing to revoke server-side. The login/logout routes
  // clear the cookie client-side.
}
