import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { cvSaveSchema, getOwnCv, saveOwnCv } from "@/lib/cv/service";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

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
