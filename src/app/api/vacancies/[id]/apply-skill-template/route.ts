import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  getProfessionSkillTemplate,
  normalizeSkillToken,
  type SupportedLocale,
} from "@/backend/skill-templates/service";

const applyBodySchema = z.object({
  professionId: z.string().trim().max(100).optional(),
  locale: z.enum(["uz", "kk", "ru", "en"]).optional(),
});

/** POST /api/vacancies/{id}/apply-skill-template — shablonni vakansiya talablariga qo'shadi (takrorlarsiz). */
export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const { company } = await requireApprovedCompany(request);
    const { id } = await context.params;

    const vacancy = await db.vacancy.findFirst({
      where: { id, companyId: company.id },
      select: { id: true, professionId: true, skills: true },
    });
    if (!vacancy) throw new ApiError(404, "VACANCY_NOT_FOUND");

    const body = await parseJson(request, applyBodySchema).catch(() => ({
      professionId: undefined,
      locale: undefined,
    }));

    const targetProfessionId = body.professionId ?? vacancy.professionId;
    if (!targetProfessionId) {
      throw new ApiError(400, "VALIDATION");
    }

    const locale: SupportedLocale = body.locale ?? "uz";
    const template = await getProfessionSkillTemplate(
      targetProfessionId,
      locale,
    );
    if (template.skills.length === 0) {
      throw new ApiError(404, "NOT_FOUND");
    }

    const existingNorm = new Set(
      vacancy.skills.map((s) => normalizeSkillToken(s)),
    );
    const merged = [...vacancy.skills];
    const added: string[] = [];

    for (const sk of template.skills) {
      const norm = normalizeSkillToken(sk.name);
      if (!existingNorm.has(norm)) {
        existingNorm.add(norm);
        merged.push(sk.name);
        added.push(sk.name);
      }
    }

    const updated = await db.vacancy.update({
      where: { id: vacancy.id },
      data: {
        professionId: targetProfessionId,
        skills: merged,
      },
      select: { id: true, professionId: true, skills: true },
    });

    return NextResponse.json({
      ok: true,
      vacancy: updated,
      added,
    });
  },
);
