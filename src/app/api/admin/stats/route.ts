import { NextResponse } from "next/server";
import { platformStats } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/session";
import { route } from "@/lib/http/route";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json(await platformStats());
});
