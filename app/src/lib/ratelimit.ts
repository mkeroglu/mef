import { redis, RATE_LIMIT_PREFIX } from "./redis";

/**
 * Fixed-window rate limiter backed by Redis. Returns true if the request
 * is allowed, false if the caller should be throttled.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }
  return count <= limit;
}
