import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { cvSaveSchema, getOwnCv, saveOwnCv } from "@/backend/cv/service";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Talabaning o'z CV si. Boshqa talabaning CV siga yo'l yo'q: faqat sessiyadagi foydalanuvchi. */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  return NextResponse.json({ cv: await getOwnCv(user.id) });
});

export const PUT = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const input = await parseJson(request, cvSaveSchema);
  return NextResponse.json({ cv: await saveOwnCv(user.id, input) });
});
