import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireCompany } from "@/backend/company/access";
import { isValidImageDataUrl, removeLogo } from "@/backend/company/logo";
import { COMPANY_SIZES } from "@/backend/company/sizes";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "FIELD_TOO_LONG" })
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v ? v : null));

const companyAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "FIELD_REQUIRED" })
    .max(120, { error: "FIELD_TOO_LONG" })
    .optional(),
  industry: nullableText(100),
  city: nullableText(100),
  country: nullableText(60),
  website: nullableText(180),
  contactEmail: z
    .string()
    .trim()
    .max(254, { error: "FIELD_TOO_LONG" })
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v ? v.toLowerCase() : null))
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      { error: "INVALID_EMAIL" },
    ),
  contactPerson: nullableText(100),
  size: z.enum(COMPANY_SIZES).nullable().optional(),
  description: nullableText(1200),
  logoDataUrl: z
    .string()
    .trim()
    .max(380_000, { error: "FILE_TOO_LARGE" })
    .nullable()
    .optional()
    .refine((v) => !v || isValidImageDataUrl(v), {
      error: "FILE_TYPE_NOT_ALLOWED",
    }),
});

export const PATCH = route(async (request) => {
  const { company } = await requireCompany(request);
  rateLimit(`company-account:${company.id}`, {
    max: 30,
    windowMs: 10 * 60_000,
  });

  const input = await parseJson(request, companyAccountSchema, 500_000);

  const data: Prisma.CompanyUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.city !== undefined) data.city = input.city;
  if (input.country !== undefined) data.country = input.country;
  if (input.website !== undefined) data.website = input.website;
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail;
  if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson;
  if (input.size !== undefined) data.size = input.size;
  if (input.description !== undefined) data.description = input.description;

  const previousDiskLogo =
    input.logoDataUrl !== undefined &&
    company.logoPath &&
    !company.logoPath.startsWith("data:")
      ? company.logoPath
      : null;

  if (input.logoDataUrl !== undefined) {
    data.logoPath = input.logoDataUrl;
    data.hasLogo = Boolean(input.logoDataUrl);
  }

  const saved = await db.company.update({
    where: { id: company.id },
    data,
    select: {
      id: true,
      name: true,
      industry: true,
      city: true,
      country: true,
      website: true,
      contactEmail: true,
      contactPerson: true,
      size: true,
      description: true,
      hasLogo: true,
    },
  });

  if (previousDiskLogo) {
    await removeLogo(previousDiskLogo).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, company: saved });
});
