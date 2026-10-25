import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedCompany } from "@/lib/company/access";
import { route } from "@/lib/http/route";
import { getMatchResults } from "@/lib/match/service";
import { getOwnVacancy } from "@/lib/vacancy/service";

type Context = { params: Promise<{ id: string }> };

const localeSchema = z.enum(["kk", "uz", "ru", "en"]).catch("uz");

/** Saqlangan natijalar. AI chaqirilmaydi. */
export const GET = route<Context>(async (request, { params }) => {
  const { company } = await requireApprovedCompany(request);
  const vacancy = await getOwnVacancy(company.id, (await params).id);
  const locale = localeSchema.parse(request.nextUrl.searchParams.get("locale"));
  return NextResponse.json(await getMatchResults(company, vacancy, locale));
});
