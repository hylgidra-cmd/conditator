import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireApprovedCompany } from "@/backend/company/access";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/**
 * Kompaniya ochiq CV ni ko'radi (ism va aloqa bilan). Faqat tasdiqlangan kompaniya,
 * faqat ochiq va saqlangan CV. Har bir ochish CvView ga yoziladi.
 */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    rateLimit(`company-cv:${company.id}`, LIMITS.companyCvView);
    const cv = await loadVisibleCvDocument((await params).id);
    if (!cv) throw new ApiError(404, "NOT_FOUND");
    await db.cvView.create({ data: { cvId: cv.id, companyId: company.id } });
    return NextResponse.json({ cv });
  },
);
