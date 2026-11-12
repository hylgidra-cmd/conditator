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

export const runtime = "nodejs";

/** Talabaning o'z saqlangan CV si PDF ko'rinishida (server tomonda, Chromium). */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const cv = await loadSavedCvDocument(user.id);
  if (!cv) throw new ApiError(409, "CV_NOT_SAVED");
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
