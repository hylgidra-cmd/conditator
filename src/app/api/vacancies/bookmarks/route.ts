import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";
import { listSavedVacancyIds } from "@/backend/vacancy/bookmarks";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  const vacancyIds = await listSavedVacancyIds(user.id);
  return NextResponse.json({ ok: true, vacancyIds });
});
