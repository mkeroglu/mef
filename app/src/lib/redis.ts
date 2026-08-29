import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export const SESSION_PREFIX = "mef:session:";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const RATE_LIMIT_PREFIX = "mef:ratelimit:";
