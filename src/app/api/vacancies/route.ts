import { type NextRequest, NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireCompany } from "@/backend/company/access";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { pageSchema, vacancyInputSchema } from "@/backend/vacancy/schema";
import {
  createVacancy,
  listVacancies,
  vacancyView,
} from "@/backend/vacancy/service";

/** Kompaniyaning talablar tarixi (sahifalangan). Tasdiqlanmagan kompaniya ham ko'radi. */
export const GET = route(async (request: NextRequest) => {
  const { company } = await requireCompany(request);
  const page = pageSchema.parse(request.nextUrl.searchParams.get("page"));
  return NextResponse.json(await listVacancies(company.id, page));
});

export const POST = route(async (request: NextRequest) => {
  const { company } = await requireCompany(request);
  rateLimit(`vacancy:${company.id}`, LIMITS.vacancyWrite);
  const input = await parseJson(request, vacancyInputSchema);
  const vacancy = await createVacancy(company.id, input);
  return NextResponse.json({ vacancy: vacancyView(vacancy) }, { status: 201 });
});
