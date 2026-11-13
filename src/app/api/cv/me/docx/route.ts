import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { loadSavedCvDocument } from "@/backend/cv-document/load";
import {
  generateObyektivkaDocx,
  mapCvDataToObyektivka,
} from "@/backend/cv-document/obyektivka-docx";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const runtime = "nodejs";

/** Talabaning o'z saqlangan CV sini Obyektivka (.docx) formatida yuklab olish. */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const cv = await loadSavedCvDocument(user.id);
  if (!cv) throw new ApiError(409, "CV_NOT_SAVED");
  rateLimit(`cv-pdf:${user.id}`, LIMITS.cvPdf);

  const buffer = await generateObyektivkaDocx(mapCvDataToObyektivka(cv.data));
  const safeName = (cv.data.fullName || "obyektivka")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .slice(0, 60);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeName}_obyektivka.docx"`,
      "Cache-Control": "private, no-store",
    },
  });
});
