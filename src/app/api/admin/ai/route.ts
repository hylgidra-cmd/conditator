import { NextResponse } from "next/server";
import { aiLimitSchema } from "@/backend/admin/schema";
import { aiStats, setAiLimit } from "@/backend/admin/service";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Shu oydagi AI so'rovlari, xarajat va oylik limit. */
export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json(await aiStats());
});

/** Oylik limitni o'zgartirish (Setting: monthlyAiLimitUsd). */
export const PUT = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  rateLimit(`admin:${admin.id}`, LIMITS.adminWrite);
  const { limitUsd } = await parseJson(request, aiLimitSchema);
  await setAiLimit(admin.id, limitUsd);
  return NextResponse.json(await aiStats());
});
