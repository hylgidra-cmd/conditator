import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireCompany } from "@/backend/company/access";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { vacancyInputSchema } from "@/backend/vacancy/schema";
import {
  getOwnVacancy,
  updateVacancy,
  vacancyView,
} from "@/backend/vacancy/service";

type Context = { params: Promise<{ id: string }> };

/** Faqat o'z talabi; boshqa kompaniyaniki 404. */
export const GET = route<Context>(async (request, { params }) => {
  const { company } = await requireCompany(request);
  const vacancy = await getOwnVacancy(company.id, (await params).id);
  return NextResponse.json({ vacancy: vacancyView(vacancy) });
});

export const PUT = route<Context>(async (request, { params }) => {
  const { company } = await requireCompany(request);
  rateLimit(`vacancy:${company.id}`, LIMITS.vacancyWrite);
  const input = await parseJson(request, vacancyInputSchema);
  const vacancy = await updateVacancy(company.id, (await params).id, input);
  return NextResponse.json({ vacancy: vacancyView(vacancy) });
});
