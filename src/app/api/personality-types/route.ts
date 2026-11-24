import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import {
  getGroupName,
  getGroupSummary,
  getLocaleKey,
  PERSONALITY_GROUPS,
  type PersonalityGroupCode,
} from "@/backend/personality/catalog";

export const GET = route(async (request) => {
  const locale = getLocaleKey(request.nextUrl.searchParams.get("locale"));
  const types = await db.personalityType.findMany({ orderBy: { code: "asc" } });
  const groups = (["NT", "NF", "SJ", "SP"] as PersonalityGroupCode[]).map(
    (code) => ({
      code,
      name: PERSONALITY_GROUPS[code].name[locale],
      summary: PERSONALITY_GROUPS[code].summary[locale],
    }),
  );
  return NextResponse.json({
    groups,
    types: types.map((type) => ({
      code: type.code,
      group: type.group,
      groupName: getGroupName(type.group, locale),
      groupSummary: getGroupSummary(type.group, locale),
      title:
        locale === "kk"
          ? type.titleKk
          : locale === "ru"
            ? type.titleRu
            : locale === "en"
              ? type.titleEn
              : type.titleUz,
      strengths:
        locale === "kk"
          ? type.strengthsKk
          : locale === "ru"
            ? type.strengthsRu
            : locale === "en"
              ? type.strengthsEn
              : type.strengthsUz,
      description:
        locale === "kk"
          ? type.descriptionKk
          : locale === "ru"
            ? type.descriptionRu
            : locale === "en"
              ? type.descriptionEn
              : type.descriptionUz,
    })),
  });
});
