import { type NextRequest, NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireCompany } from "@/lib/company/access";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";
import { pageSchema, vacancyInputSchema } from "@/lib/vacancy/schema";
import {
  createVacancy,
  listVacancies,
  vacancyView,
} from "@/lib/vacancy/service";

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
