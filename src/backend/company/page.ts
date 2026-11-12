import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";

/** Kompaniya sahifalari uchun: kirmagan bo'lsa login ga, boshqa rol bo'lsa kabinetga. */
export async function requireCompanyPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "COMPANY") return redirect({ href: "/account", locale });
  const company = await db.company.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return { user, company, locale };
}
