import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import {
  cvSaveSchema,
  deleteOwnCv,
  getOwnCv,
  saveOwnCv,
} from "@/backend/cv/service";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Talabaning o'z CV si. Boshqa talabaning CV siga yo'l yo'q: faqat sessiyadagi foydalanuvchi. */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  return NextResponse.json({ cv: await getOwnCv(user.id) });
});

export const PUT = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const input = await parseJson(request, cvSaveSchema, 700_000);
  return NextResponse.json({ cv: await saveOwnCv(user.id, input) });
});

export const DELETE = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const cvId = request.nextUrl.searchParams.get("cvId")?.trim();
  if (!cvId) throw new ApiError(400, "VALIDATION");
  await deleteOwnCv(user.id, cvId);
  return NextResponse.json({ ok: true });
});
