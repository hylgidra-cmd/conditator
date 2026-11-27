import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireApprovedCompany } from "@/backend/company/access";
import {
  loadVisibleCvDocument,
  pdfContentDisposition,
} from "@/backend/cv-document/load";
import { renderCvPdf } from "@/backend/cv-document/pdf";
import { isCvLockedForCompany } from "@/backend/payment/service";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Kompaniya uchun ochiq CV ning PDF i. Ruxsat: GET /api/cv/:id bilan bir xil. */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    rateLimit(`cv-pdf:company:${company.id}`, LIMITS.cvPdf);
    const cvId = (await params).id;
    const vacancyId = new URL(request.url).searchParams.get("vacancyId");
    const isLocked = await isCvLockedForCompany(cvId, company.id, vacancyId);
    if (isLocked) {
      throw new ApiError(403, "SUBSCRIPTION_REQUIRED");
    }
    const cv = await loadVisibleCvDocument(cvId, {
      isLocked: false,
      appliedCompanyId: company.id,
    });
    if (!cv) throw new ApiError(404, "NOT_FOUND");
    await db.cvView.create({
      data: { cvId: cv.id, companyId: company.id, pdf: true },
    });
    const pdf = await renderCvPdf(cv);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": pdfContentDisposition(cv.data.fullName),
        "Cache-Control": "private, no-store",
      },
    });
  },
);
