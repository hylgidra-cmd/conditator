import { Lang } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedCompany } from "@/backend/company/access";
import { scanCvsWithAi } from "@/backend/cv/quality";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const bodySchema = z.object({
  run: z.literal(true),
  locale: z.nativeEnum(Lang).default(Lang.uz),
});

/**
 * Tasdiqlangan kompaniya uchun ochiq CV larni AI yordamida o'qish va
 * "Mukammal CV (80–100%)" hamda "Ochiq CV (<80%)" toifalariga ajratish.
 */
export const POST = route(async (request) => {
  const { user } = await requireApprovedCompany(request);
  const input = await parseJson(request, bodySchema);

  const cvs = await db.cv.findMany({
    where: {
      isVisible: true,
      savedAt: { not: null },
      user: { status: "ACTIVE" },
    },
    orderBy: { savedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      data: true,
    },
  });

  const parsedCvs = cvs.flatMap((cv) => {
    const parsed = cvDataSchema.safeParse(cv.data);
    if (!parsed.success) return [];
    return [{ id: cv.id, title: cv.title, data: parsed.data }];
  });

  const result = await scanCvsWithAi({
    cvs: parsedCvs,
    locale: input.locale,
    userId: user.id,
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
});
