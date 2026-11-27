import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";

// Xotiradagi tezkor cheklov + muhim nuqtalar uchun Postgres taqsimlangan cheklov.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export const LIMITS = {
  login: { max: 10, windowMs: 15 * 60_000 },
  loginIp: { max: 50, windowMs: 15 * 60_000 },
  verify: { max: 20, windowMs: 15 * 60_000 },
  sendCode: { max: 5, windowMs: 60 * 60_000 },
  register: { max: 10, windowMs: 60 * 60_000 },
  cvGenerate: { max: 10, windowMs: 60 * 60_000 },
  cvPdf: { max: 30, windowMs: 60 * 60_000 },
  companyCvView: { max: 300, windowMs: 60 * 60_000 },
  logoUpload: { max: 20, windowMs: 60 * 60_000 },
  vacancyWrite: { max: 60, windowMs: 60 * 60_000 },
  vacancyApply: { max: 40, windowMs: 60 * 60_000 },
  cvWrite: { max: 60, windowMs: 60 * 60_000 },
  chatSend: { max: 60, windowMs: 60_000 },
  complaintCreate: { max: 10, windowMs: 60 * 60_000 },
  matchRun: { max: 30, windowMs: 60 * 60_000 },
  adminWrite: { max: 300, windowMs: 60 * 60_000 },
} as const;

export function rateLimit(
  key: string,
  limit: { max: number; windowMs: number },
): void {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit.max) throw new ApiError(429, "RATE_LIMITED");
}

/**
 * Serverless muhit (Vercel) uchun Postgres bazasida atomik rate-limit.
 * Auth, 2FA, AI va to'lov so'rovlarida barcha nusxalar bo'ylab umumiy hisob yuritadi.
 */
export async function rateLimitDistributed(
  key: string,
  limit: { max: number; windowMs: number },
): Promise<void> {
  const safeKey = key.slice(0, 240);
  const nextReset = new Date(Date.now() + limit.windowMs);
  try {
    const rows = await db.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
      VALUES (${safeKey}, 1, ${nextReset})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${nextReset}
          ELSE "RateLimitBucket"."resetAt"
        END
      RETURNING "count"
    `;
    const count = rows[0]?.count ?? 1;
    if (count > limit.max) {
      throw new ApiError(429, "RATE_LIMITED");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    rateLimit(safeKey, limit);
  }
}

export function resetRateLimits(): void {
  buckets.clear();
}
