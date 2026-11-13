import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireApprovedCompany } from "@/backend/company/access";
import {
  loadVisibleCvDocument,
  pdfContentDisposition,
} from "@/backend/cv-document/load";
import { renderCvPdf } from "@/backend/cv-document/pdf";
import { isVacancyUnlocked } from "@/backend/payment/service";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const runtime = "nodejs";

/** Kompaniya uchun ochiq CV ning PDF i. Ruxsat: GET /api/cv/:id bilan bir xil. */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    rateLimit(`cv-pdf:company:${company.id}`, LIMITS.cvPdf);
    const cvId = (await params).id;
    const vacancyId = new URL(request.url).searchParams.get("vacancyId");
    let isLocked = false;
    if (vacancyId) {
      const [match, unlocked] = await Promise.all([
        db.match.findUnique({
          where: { vacancyId_cvId: { vacancyId, cvId } },
          select: { score: true },
        }),
        isVacancyUnlocked(company.id, vacancyId),
      ]);
      isLocked = Boolean(match && match.score >= 80 && !unlocked);
    }
    const cv = await loadVisibleCvDocument(cvId, { isLocked });
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
