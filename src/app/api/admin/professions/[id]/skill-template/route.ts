import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  adminUpdateSkillTemplatesSchema,
  getProfessionSkillTemplate,
  saveAdminProfessionSkillTemplates,
} from "@/backend/skill-templates/service";

/** GET /api/admin/professions/{id}/skill-template — admin uchun 6 ko'nikma (barcha tillarda) + o'zgarish tarixi. */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const [data, logs] = await Promise.all([
      getProfessionSkillTemplate(id, "uz"),
      db.adminLog.findMany({
        where: {
          action: { in: ["SKILL_TEMPLATE_EDIT", "SKILL_TEMPLATE_IMPORT"] },
          OR: [{ targetId: id }, { targetId: "bulk" }],
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          admin: { select: { email: true, fullName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      professionId: data.professionId,
      professionName: data.professionName,
      skills: data.rawSkills.map((r) => ({
        id: r.id,
        position: r.position,
        nameUz: r.nameUz,
        nameKk: r.nameKk,
        nameRu: r.nameRu,
        nameEn: r.nameEn,
        descriptionUz: r.descriptionUz,
        descriptionKk: r.descriptionKk,
        descriptionRu: r.descriptionRu,
        descriptionEn: r.descriptionEn,
        synonyms: r.synonyms,
        updatedAt: r.updatedAt.toISOString(),
      })),
      history: logs.map((l) => ({
        id: l.id,
        action: l.action,
        adminEmail: l.admin?.email ?? "Admin",
        createdAt: l.createdAt.toISOString(),
        details: l.details,
      })),
    });
  },
);

/** PUT /api/admin/professions/{id}/skill-template — aynan 6 ta ko'nikmani saqlaydi. */
export const PUT = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const admin = await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const input = await parseJson(request, adminUpdateSkillTemplatesSchema);
    const saved = await saveAdminProfessionSkillTemplates({
      adminId: admin.id,
      professionId: id,
      skills: input.skills,
    });

    return NextResponse.json({
      ok: true,
      skills: saved.map((r) => ({
        id: r.id,
        position: r.position,
        nameUz: r.nameUz,
        nameKk: r.nameKk,
        nameRu: r.nameRu,
        nameEn: r.nameEn,
        descriptionUz: r.descriptionUz,
        descriptionKk: r.descriptionKk,
        descriptionRu: r.descriptionRu,
        descriptionEn: r.descriptionEn,
        synonyms: r.synonyms,
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  },
);
