import { NextResponse } from "next/server";
import { platformStats } from "@/backend/admin/service";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json(await platformStats());
});
