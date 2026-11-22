import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";
import {
  listReadinessCandidates,
  parseFilters,
} from "@/backend/readiness/query";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const filters = parseFilters(request.nextUrl.searchParams);
  return NextResponse.json(await listReadinessCandidates(filters));
});
