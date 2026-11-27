import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { queryCompanyStats } from "@/backend/company/stats";
import { db } from "@/backend/db";
import { CompanyStatsView } from "@/frontend/components/company/company-stats-view";

export default async function CompanyStatsPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return redirect({ href: "/account", locale });
  }
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    const company = await db.company.findFirst({
      where: {
        OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
      },
      select: { approval: true },
    });
    if (company?.approval !== "APPROVED") {
      return redirect({ href: "/company", locale });
    }
  }
  const lang =
    locale === "kk" || locale === "ru" || locale === "en" ? locale : "uz";
  const initialData = await queryCompanyStats({}, lang, { isAdmin });

  return (
    <CompanyStatsView
      locale={lang}
      initialData={initialData}
      isAdmin={isAdmin}
    />
  );
}
