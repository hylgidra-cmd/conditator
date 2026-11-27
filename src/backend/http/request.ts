import type { NextRequest } from "next/server";
import { serverEnv } from "@/backend/env";
import { ApiError } from "./errors";

/**
 * Mijoz IP manzili. X-Forwarded-For ning OXIRGI qiymati olinadi: uni bizning proxy (Caddy) qo'yadi.
 * Birinchi qiymatni mijozning o'zi yozib yuborishi mumkin (rate limit ni aylanib o'tish uchun).
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",").at(-1)?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** CSRF himoyasi: o'zgartiruvchi so'rov boshqa saytdan kelgan bo'lsa rad etiladi. */
export function assertSameOrigin(request: NextRequest): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new ApiError(403, "BAD_ORIGIN");
  }

  const allowedOrigins = new Set<string>([
    new URL(serverEnv().APP_URL).origin,
    "https://candidator.uz",
    "https://www.candidator.uz",
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowedOrigins.add(new URL(siteUrl).origin);
    } catch {
      // Ignore malformed optional env
    }
  }
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add(request.nextUrl.origin);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    if (!allowedOrigins.has(origin) && origin !== request.nextUrl.origin) {
      throw new ApiError(403, "BAD_ORIGIN");
    }
    return;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (
        !allowedOrigins.has(refOrigin) &&
        refOrigin !== request.nextUrl.origin
      ) {
        throw new ApiError(403, "BAD_ORIGIN");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(403, "BAD_ORIGIN");
    }
  }
}
