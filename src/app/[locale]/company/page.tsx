import { getTranslations } from "next-intl/server";
import { CompanyLogo } from "@/frontend/components/company/company-logo";
import { CompanyProfileForm } from "@/frontend/components/company/company-profile-form";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { publicCompany } from "@/backend/company/profile";
import { formatDate } from "@/backend/format-date";

const TONE = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
} as const;

export default async function CompanyPage() {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company");
  const access = companyAccess(company);
  const view = publicCompany(company);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/company/billing"
            className="border-border bg-surface rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {t("billingLink")}
          </Link>
          <Link
            href="/company/vacancies"
            className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold"
          >
            {t("vacanciesLink")}
          </Link>
        </div>
      </div>

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
        {company.approval === "APPROVED" ? (
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/company/vacancies/new"
              className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {t("postVacancyLink")}
            </Link>
            <Link
              href="/company/vacancies"
              className="border-border bg-surface rounded-lg border px-4 py-2 text-sm font-medium"
            >
              {t("vacanciesLink")}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="border-border bg-surface space-y-5 rounded-2xl border p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t("profile.title")}</h2>
        <div className="border-border/60 border-b pb-5">
          <p className="text-muted mb-2 text-xs font-bold uppercase">
            {t("logo.title")}
          </p>
          <CompanyLogo initialHasLogo={view.hasLogo} />
        </div>
        <CompanyProfileForm
          initial={view}
          isApproved={company.approval === "APPROVED"}
        />
      </section>
    </div>
  );
}
