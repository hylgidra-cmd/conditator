import { ApiError } from "@/lib/http/errors";

// Xotiradagi oddiy cheklov (bitta ilova nusxasi uchun yetarli, MVP).
// Bir nechta nusxa ishga tushirilsa, Redis yoki bazaga ko'chirish kerak.
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
} as const;

export function rateLimit(
  key: string,
  limit: { max: number; windowMs: number },
): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit.max) throw new ApiError(429, "RATE_LIMITED");
}

export function resetRateLimits(): void {
  buckets.clear();
}
