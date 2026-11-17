import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireApprovedCompany } from "@/backend/company/access";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { isCvLockedForCompany } from "@/backend/payment/service";

/**
 * Kompaniya ochiq CV ni ko'radi. Faqat tasdiqlangan kompaniya,
 * faqat ochiq va saqlangan CV. 80%+ mos nomzod ochilmagan bo'lsa aloqa yashiriladi.
 */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    rateLimit(`company-cv:${company.id}`, LIMITS.companyCvView);
    const cvId = (await params).id;
    const vacancyId = new URL(request.url).searchParams.get("vacancyId");
    const isLocked = await isCvLockedForCompany(cvId, company.id, vacancyId);
    const cv = await loadVisibleCvDocument(cvId, { isLocked });
    if (!cv) throw new ApiError(404, "NOT_FOUND");
    await db.cvView.create({ data: { cvId: cv.id, companyId: company.id } });
    return NextResponse.json({ cv, isLocked });
  },
);
