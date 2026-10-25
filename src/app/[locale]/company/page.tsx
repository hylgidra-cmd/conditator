import { getLocale, getTranslations } from "next-intl/server";
import { CompanyLogo } from "@/components/company/company-logo";
import { CompanyProfileForm } from "@/components/company/company-profile-form";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { companyAccess } from "@/lib/company/access";
import { publicCompany } from "@/lib/company/profile";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format-date";

const TONE = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
} as const;

export default async function CompanyPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "COMPANY") return redirect({ href: "/account", locale });

  const t = await getTranslations("Company");
  const company = await db.company.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  const access = companyAccess(company);
  const view = publicCompany(company);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <section className="border-border bg-surface space-y-3 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t("status.title")}</h2>
        <p
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${TONE[company.approval]}`}
        >
          {t(`status.${company.approval}`)}
        </p>
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${access.subscriptionActive ? TONE.APPROVED : "border-border text-muted"}`}
        >
          {access.subscriptionActive && company.subscriptionUntil
            ? t("status.subscriptionActive", {
                date: formatDate(company.subscriptionUntil),
              })
            : t("status.subscriptionInactive")}
        </p>
      </section>

      <section className="border-border bg-surface space-y-4 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t("profile.title")}</h2>
        <CompanyProfileForm initial={view} />
      </section>

      <section className="border-border bg-surface space-y-4 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t("logo.title")}</h2>
        <CompanyLogo initialHasLogo={view.hasLogo} />
      </section>
    </div>
  );
}
