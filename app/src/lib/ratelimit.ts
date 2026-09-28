/**
 * In-memory fixed-window rate limiter (no Redis on shared hosting).
 * Resets whenever the Node process restarts — acceptable for this app's
 * traffic level, where a restart is rare and the cost of a reset is nil.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
