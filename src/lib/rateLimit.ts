// A lightweight in-memory rate limiter. This works because the app runs as
// a single persistent Node process on Railway (not serverless functions
// that reset between requests) — the Map below just lives in memory for as
// long as the process runs. If this app ever moves to multiple instances
// behind a load balancer, replace this with a shared store (e.g. Redis/
// Upstash) so limits apply across all instances, not per-instance.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Periodic cleanup so this Map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

// Best-effort client identifier — good enough for abuse deterrence, not a
// substitute for a real WAF against a determined/distributed attacker.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
