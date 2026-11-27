import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { requireApprovedCompany } from "@/backend/company/access";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  getCvSkillFit,
  type SupportedLocale,
} from "@/backend/skill-templates/service";

function parseLocale(raw: string | null): SupportedLocale {
  return raw === "kk" || raw === "ru" || raw === "en" ? raw : "uz";
}

/**
 * GET /api/cv/{id}/skill-fit — "4 / 6" va yetishmagan ko'nikmalar.
 * Maxfiylik qoidasi (TZ 3): yetishmagan ko'nikmalar FAQAT CV egasiga (va Adminga); HR ga faqat son!
 */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request);
    const { id } = await context.params;
    const locale = parseLocale(request.nextUrl.searchParams.get("locale"));
    const professionId = request.nextUrl.searchParams.get("professionId");

    const cv = await db.cv.findUnique({
      where: { id },
      select: { id: true, userId: true, isVisible: true, savedAt: true },
    });
    if (!cv) throw new ApiError(404, "NOT_FOUND");

    const isOwner = cv.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      if (user.role !== "COMPANY" || !cv.savedAt) {
        throw new ApiError(403, "FORBIDDEN");
      }
      const { company } = await requireApprovedCompany(request);
      if (!cv.isVisible) {
        const applied = await db.vacancyApplication.findFirst({
          where: { cvId: cv.id, vacancy: { companyId: company.id } },
          select: { id: true },
        });
        if (!applied) throw new ApiError(403, "FORBIDDEN");
      }
    }

    const fit = await getCvSkillFit({
      cvId: cv.id,
      locale,
      includeMissing: isOwner || isAdmin,
      professionId,
    });

    return NextResponse.json({ fit });
  },
);
