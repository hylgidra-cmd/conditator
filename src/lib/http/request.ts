import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { ApiError } from "./errors";

/** Mijoz IP manzili (Caddy/proxy orqasida X-Forwarded-For ning birinchi qiymati). */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** CSRF himoyasi: o'zgartiruvchi so'rov boshqa saytdan kelgan bo'lsa rad etiladi. */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // brauzer bo'lmagan mijozlar (curl, testlar)
  const allowed = new URL(serverEnv().APP_URL).origin;
  if (origin !== allowed && origin !== request.nextUrl.origin) {
    throw new ApiError(403, "BAD_ORIGIN");
  }
}
