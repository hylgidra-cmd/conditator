import { NextResponse } from "next/server";
import { recentAdminLogs } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";

/** Oxirgi 50 ta admin harakati. */
export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json({ items: await recentAdminLogs(50) });
});
