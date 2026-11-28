import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import {
  loadSavedCvDocument,
  pdfContentDisposition,
} from "@/backend/cv-document/load";
import { renderCvPdf } from "@/backend/cv-document/pdf";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { FREE_ACCESS_MODE } from "@/backend/payment/free-mode";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Talabaning o'z saqlangan CV si PDF ko'rinishida (server tomonda, Chromium). */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const cvId = request.nextUrl.searchParams.get("cvId") || undefined;
  const cv = await loadSavedCvDocument(user.id, cvId);
  if (!cv) throw new ApiError(409, "CV_NOT_SAVED");
  if (!FREE_ACCESS_MODE && !cv.isPaid) throw new ApiError(402, "CV_PAYMENT_REQUIRED");
  rateLimit(`cv-pdf:${user.id}`, LIMITS.cvPdf);

  const pdf = await renderCvPdf(cv);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(cv.data.fullName),
      "Cache-Control": "private, no-store",
    },
  });
});
