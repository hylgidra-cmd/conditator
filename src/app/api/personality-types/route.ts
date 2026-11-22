import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  const locale = request.nextUrl.searchParams.get("locale") ?? "uz";
  const types = await db.personalityType.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({
    types: types.map((type) => ({
      code: type.code,
      group: type.group,
      title:
        locale === "kk"
          ? type.titleKk
          : locale === "ru"
            ? type.titleRu
            : locale === "en"
              ? type.titleEn
              : type.titleUz,
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
