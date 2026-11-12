import type { Company } from "@prisma/client";
import type { NextRequest } from "next/server";
import { requireRole, type SessionUser } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";

/**
 * Kompaniya nima qila oladi. Yagona qoida: sahifa ham, har bir endpoint ham shundan foydalanadi.
 * - Profil va talab: har qanday kompaniya (PENDING ham).
 * - CV ko'rish (ochiq CV lar): faqat admin tasdiqlagan kompaniya.
 * - AI saralash: tasdiqlangan + obuna faol (subscriptionUntil > hozir).
 */
export function companyAccess(
  company: Pick<Company, "approval" | "subscriptionUntil">,
  now = new Date(),
) {
  const approved = company.approval === "APPROVED";
  const subscriptionActive =
    company.subscriptionUntil !== null && company.subscriptionUntil > now;
  return {
    approved,
    subscriptionActive,
    canViewCvs: approved,
    canRunMatching: approved && subscriptionActive,
  };
}

/** Kompaniya roli va uning profili. Profil ro'yxatdan o'tishda yaratiladi; bo'lmasa shu yerda yaratiladi. */
export async function requireCompany(
  request: NextRequest,
): Promise<{ user: SessionUser; company: Company }> {
  const user = await requireRole(request, "COMPANY");
  const company = await db.company.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return { user, company };
}

/** CV ga tegishli har bir kompaniya endpointi shu bilan boshlanadi: tasdiqlanmagan bo'lsa 403. */
export async function requireApprovedCompany(request: NextRequest) {
  const result = await requireCompany(request);
  if (!companyAccess(result.company).canViewCvs)
    throw new ApiError(403, "COMPANY_NOT_APPROVED");
  return result;
}
