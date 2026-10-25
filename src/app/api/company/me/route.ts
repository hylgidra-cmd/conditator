import { NextResponse } from "next/server";
import { requireCompany } from "@/lib/company/access";
import {
  companyProfileSchema,
  publicCompany,
  saveCompanyProfile,
} from "@/lib/company/profile";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

/** Kompaniyaning o'z profili. Tasdiqlanmagan kompaniya ham tahrirlay oladi. */
export const GET = route(async (request) => {
  const { company } = await requireCompany(request);
  return NextResponse.json({ company: publicCompany(company) });
});

export const PUT = route(async (request) => {
  const { company } = await requireCompany(request);
  const input = await parseJson(request, companyProfileSchema);
  const saved = await saveCompanyProfile(company.id, input);
  return NextResponse.json({ company: publicCompany(saved) });
});
