import { randomBytes } from "crypto";
import { redis, SESSION_PREFIX, SESSION_TTL_SECONDS } from "./redis";

export const SESSION_COOKIE = "mef_admin_session";

export async function createSession(adminId: string, email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await redis.set(
    `${SESSION_PREFIX}${token}`,
    JSON.stringify({ adminId, email }),
    "EX",
    SESSION_TTL_SECONDS
  );
  return token;
}

export async function getSession(
  token: string | undefined
): Promise<{ adminId: string; email: string } | null> {
  if (!token) return null;
  const raw = await redis.get(`${SESSION_PREFIX}${token}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await redis.del(`${SESSION_PREFIX}${token}`);
}
