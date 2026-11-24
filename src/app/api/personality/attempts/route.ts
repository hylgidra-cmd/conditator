import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";
import { startOrResumeAttempt } from "@/backend/personality/service";

export const POST = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const locale =
    request.nextUrl.searchParams.get("locale") ?? user.locale ?? "uz";
  const attempt = await startOrResumeAttempt(user.id, locale);
  return NextResponse.json({ attempt });
});
