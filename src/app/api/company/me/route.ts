import { NextResponse } from "next/server";
import { requireCompany } from "@/backend/company/access";
import {
  companyProfileSchema,
  publicCompany,
  saveCompanyProfile,
} from "@/backend/company/profile";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

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
