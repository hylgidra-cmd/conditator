import type { Company } from "@prisma/client";
import { z } from "zod";
import { db } from "@/backend/db";
import { COMPANY_SIZES } from "./sizes";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "FIELD_TOO_LONG" })
    .nullable()
    .transform((value) => (value ? value : null));

export const companyProfileSchema = z.object({
  name: z
    .string({ error: "FIELD_REQUIRED" })
    .trim()
    .min(1, { error: "FIELD_REQUIRED" })
    .max(120, { error: "FIELD_TOO_LONG" }),
  country: optionalText(60),
  industry: optionalText(100),
  size: z.enum(COMPANY_SIZES, { error: "FIELD_REQUIRED" }).nullable(),
  contactPerson: optionalText(100),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

/** Kompaniyaning o'zi ko'radigan maydonlar (logo yo'li emas, faqat bor-yo'qligi). */
export function publicCompany(company: Company) {
  return {
    name: company.name,
    country: company.country,
    industry: company.industry,
    size: company.size,
    contactPerson: company.contactPerson,
    hasLogo: company.logoPath !== null,
    approval: company.approval,
    subscriptionUntil: company.subscriptionUntil?.toISOString() ?? null,
  };
}

export function saveCompanyProfile(
  companyId: string,
  input: CompanyProfileInput,
): Promise<Company> {
  // Tasdiq holati va obuna bu yerda o'zgarmaydi: ularni faqat admin o'zgartiradi.
  return db.company.update({ where: { id: companyId }, data: input });
}
