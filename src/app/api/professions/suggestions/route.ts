import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import {
  getLocaleKey,
  PERSONALITY_GROUPS,
  PERSONALITY_TYPE_CATALOG,
  type PersonalityGroupCode,
} from "@/backend/personality/catalog";

export const GET = route(async (request) => {
  const locale = getLocaleKey(request.nextUrl.searchParams.get("locale"));
  const [professions, dbTypes] = await Promise.all([
    db.profession.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }],
      select: {
        id: true,
        parentId: true,
        nameUz: true,
        nameKk: true,
        nameRu: true,
        nameEn: true,
        typeSuggestion: { select: { typeCodes: true } },
      },
    }),
    db.personalityType.findMany({ orderBy: { code: "asc" } }),
  ]);

  const locName = (p: {
    nameUz: string;
    nameKk: string;
    nameRu: string;
    nameEn: string;
  }) =>
    locale === "kk"
      ? p.nameKk
      : locale === "ru"
        ? p.nameRu
        : locale === "en"
          ? p.nameEn
          : p.nameUz;

  const areas = professions.filter((p) => !p.parentId);
  const childrenByParent = new Map<string, typeof professions>();
  for (const p of professions) {
    if (!p.parentId) continue;
    const list = childrenByParent.get(p.parentId) ?? [];
    list.push(p);
    childrenByParent.set(p.parentId, list);
  }

  const dbTypeMap = new Map(dbTypes.map((t) => [t.code, t]));

  return NextResponse.json({
    groups: (["NT", "NF", "SJ", "SP"] as PersonalityGroupCode[]).map(
      (code) => ({
        code,
        name: PERSONALITY_GROUPS[code].name[locale],
        summary: PERSONALITY_GROUPS[code].summary[locale],
      }),
    ),
    types: PERSONALITY_TYPE_CATALOG.map((item) => {
      const dbT = dbTypeMap.get(item.code);
      return {
        code: item.code,
        group: item.group,
        name: dbT
          ? locale === "kk"
            ? dbT.titleKk
            : locale === "ru"
              ? dbT.titleRu
              : locale === "en"
                ? dbT.titleEn
                : dbT.titleUz
          : item.title[locale],
        strengths: dbT
          ? (locale === "kk"
              ? dbT.strengthsKk
              : locale === "ru"
                ? dbT.strengthsRu
                : locale === "en"
                  ? dbT.strengthsEn
                  : dbT.strengthsUz) || item.strengths[locale]
          : item.strengths[locale],
      };
    }),
    professions: areas.map((area) => ({
      id: area.id,
      name: locName(area),
      items: (childrenByParent.get(area.id) ?? []).map((job) => ({
        id: job.id,
        name: locName(job),
        suggestedTypes: job.typeSuggestion?.typeCodes ?? [],
      })),
    })),
  });
});
