import { ApiError } from "@/utils/api-error";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter di memori.
 * Di Vercel setiap instance punya memori sendiri, jadi ini lapisan tambahan saja;
 * perlindungan utama login tetap lockout akun di DB.
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) prune(now);
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    throw ApiError.tooManyRequests("error.too_many_requests", {
      params: { retryAfterSeconds },
      errors: { retryAfterSeconds },
    });
  }
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
