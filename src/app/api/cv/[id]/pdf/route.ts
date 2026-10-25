import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireApprovedCompany } from "@/lib/company/access";
import {
  loadVisibleCvDocument,
  pdfContentDisposition,
} from "@/lib/cv-document/load";
import { renderCvPdf } from "@/lib/cv-document/pdf";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

export const runtime = "nodejs";

/** Kompaniya uchun ochiq CV ning PDF i. Ruxsat: GET /api/cv/:id bilan bir xil. */
export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const { company } = await requireApprovedCompany(request);
    rateLimit(`cv-pdf:company:${company.id}`, LIMITS.cvPdf);
    const cv = await loadVisibleCvDocument((await params).id);
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
