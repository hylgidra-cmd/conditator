import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import {
  cvSaveSchema,
  deleteOwnCv,
  getOwnCv,
  saveOwnCv,
} from "@/backend/cv/service";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { rebuildReadiness } from "@/backend/readiness/service";
import { recalculateCvSkillMatchesForCv } from "@/backend/skill-templates/service";

/** Talabaning o'z CV si. Boshqa talabaning CV siga yo'l yo'q: faqat sessiyadagi foydalanuvchi. */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  return NextResponse.json({ cv: await getOwnCv(user.id) });
});

export const PUT = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  rateLimit(`cv-write:${user.id}`, LIMITS.cvWrite);
  const input = await parseJson(request, cvSaveSchema, 700_000);
  const cv = await saveOwnCv(user.id, input);
  await rebuildReadiness(user.id);
  await recalculateCvSkillMatchesForCv(cv.id).catch(() => undefined);
  return NextResponse.json({ cv });
});

export const DELETE = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  rateLimit(`cv-write:${user.id}`, LIMITS.cvWrite);
  const cvId = request.nextUrl.searchParams.get("cvId")?.trim();
  if (!cvId) throw new ApiError(400, "VALIDATION");
  await deleteOwnCv(user.id, cvId);
  await rebuildReadiness(user.id);
  return NextResponse.json({ ok: true });
});
