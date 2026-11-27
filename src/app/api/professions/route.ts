import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import {
  localizedProfessionName,
  type SupportedLocale,
} from "@/backend/skill-templates/service";

function parseLocale(raw: string | null): SupportedLocale {
  return raw === "kk" || raw === "ru" || raw === "en" ? raw : "uz";
}

export const GET = route(async (request) => {
  const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
  const areas = await db.profession.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sort: "asc" },
    select: {
      id: true,
      nameUz: true,
      nameKk: true,
      nameRu: true,
      nameEn: true,
      children: {
        where: { isActive: true },
        orderBy: { sort: "asc" },
        select: {
          id: true,
          nameUz: true,
          nameKk: true,
          nameRu: true,
          nameEn: true,
          _count: { select: { skillTemplates: true } },
        },
      },
    },
  });

  return NextResponse.json({
    areas: areas.map((a) => ({
      id: a.id,
      name: localizedProfessionName(a, locale),
      professions: a.children.map((p) => ({
        id: p.id,
        name: localizedProfessionName(p, locale),
        hasSkillTemplate: p._count.skillTemplates === 6,
      })),
    })),
  });
});
