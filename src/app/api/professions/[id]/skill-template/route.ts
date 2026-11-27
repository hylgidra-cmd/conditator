import { NextResponse } from "next/server";
import { route } from "@/backend/http/route";
import {
  getProfessionSkillTemplate,
  type SupportedLocale,
} from "@/backend/skill-templates/service";

function parseLocale(raw: string | null): SupportedLocale {
  return raw === "kk" || raw === "ru" || raw === "en" ? raw : "uz";
}

/** GET /api/professions/{id}/skill-template — kasbning 6 ko'nikmasi (joriy tilda). */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const { id } = await context.params;
    const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
    const data = await getProfessionSkillTemplate(id, locale);
    return NextResponse.json({
      professionId: data.professionId,
      professionName: data.professionName,
      skills: data.skills,
    });
  },
);
