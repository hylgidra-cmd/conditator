import { NextResponse } from "next/server";
import { requireApprovedCompany } from "@/backend/company/access";
import { route } from "@/backend/http/route";
import {
  getCompanyProfessionSkillStats,
  type SupportedLocale,
} from "@/backend/skill-templates/service";

function parseLocale(raw: string | null): SupportedLocale {
  return raw === "kk" || raw === "ru" || raw === "en" ? raw : "uz";
}

/**
 * GET /api/company/statistics/professions/{id}/skills
 * Statistika sahifasi uchun har ko'nikma bo'yicha talabalar soni (5 dan kam bo'lsa "5 dan kam").
 */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    await requireApprovedCompany(request);
    const { id } = await context.params;
    const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
    const stats = await getCompanyProfessionSkillStats(id, locale);
    return NextResponse.json(stats);
  },
);
