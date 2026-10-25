import { NextResponse } from "next/server";
import { recentAdminLogs } from "@/lib/admin/log";
import { requireRole } from "@/lib/auth/session";
import { route } from "@/lib/http/route";

/** Oxirgi 50 ta admin harakati. */
export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json({ items: await recentAdminLogs(50) });
});
