import { NextResponse } from "next/server";
import { companyListSchema, fromSearchParams } from "@/backend/admin/schema";
import { listCompanies } from "@/backend/admin/service";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const query = companyListSchema.parse(
    fromSearchParams(request.nextUrl.searchParams),
  );
  return NextResponse.json(await listCompanies(query));
});
