import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireRole } from "@/lib/auth/session";
import {
  loadSavedCvDocument,
  pdfContentDisposition,
} from "@/lib/cv-document/load";
import { renderCvPdf } from "@/lib/cv-document/pdf";
import { ApiError } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

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
