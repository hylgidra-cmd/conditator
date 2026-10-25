import { NextResponse } from "next/server";
import { companyListSchema, fromSearchParams } from "@/lib/admin/schema";
import { listCompanies } from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/session";
import { route } from "@/lib/http/route";

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const query = companyListSchema.parse(
    fromSearchParams(request.nextUrl.searchParams),
  );
  return NextResponse.json(await listCompanies(query));
});
