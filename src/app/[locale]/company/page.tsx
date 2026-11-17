import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Company");
  return { title: t("title") };
}
import { CompanyLogo } from "@/frontend/components/company/company-logo";
import { CompanyProfileForm } from "@/frontend/components/company/company-profile-form";
import { Reveal } from "@/frontend/components/ds/motion";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { publicCompany } from "@/backend/company/profile";
import { formatDate } from "@/backend/format-date";

const TONE = {
  PENDING: "border-primary/30 bg-primary-soft text-primary-text",
  APPROVED: "border-emerald-500/30 bg-success-soft text-success",
  REJECTED: "border-red-500/30 bg-danger-soft text-danger",
} as const;

export default async function CompanyPage() {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company");
  const access = companyAccess(company);
  const view = publicCompany(company);

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/company/billing"
                className="border-line bg-canvas text-text hover:border-primary rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors"
              >
                {t("billingLink")}
              </Link>
              <Link
                href="/company/vacancies"
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
              >
                {t("vacanciesLink")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={75}>
        <section className="border-line bg-card/90 shadow-soft space-y-3.5 rounded-3xl border p-6 backdrop-blur-md">
          <h2 className="text-text text-lg font-extrabold">
            {t("status.title")}
          </h2>
          <p
            role="status"
            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold ${TONE[company.approval]}`}
          >
            {t(`status.${company.approval}`)}
          </p>
          <p
            className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${access.subscriptionActive ? TONE.APPROVED : "border-line bg-card-cool/50 text-subtle"}`}
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
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-5 py-2.5 text-xs font-bold transition-all"
              >
                {t("postVacancyLink")}
              </Link>
              <Link
                href="/company/vacancies"
                className="border-line bg-canvas text-text hover:border-primary rounded-2xl border px-5 py-2.5 text-xs font-bold transition-colors"
              >
                {t("vacanciesLink")}
              </Link>
            </div>
          ) : null}
        </section>
      </Reveal>

      <Reveal delay={150}>
        <section className="border-line bg-card/90 shadow-soft space-y-5 rounded-3xl border p-6 backdrop-blur-md">
          <h2 className="text-text text-lg font-extrabold">
            {t("profile.title")}
          </h2>
          <div className="border-line/70 border-b pb-5">
            <p className="text-subtle mb-2 text-xs font-bold uppercase">
              {t("logo.title")}
            </p>
            <CompanyLogo initialHasLogo={view.hasLogo} />
          </div>
          <CompanyProfileForm
            initial={view}
            isApproved={company.approval === "APPROVED"}
          />
        </section>
      </Reveal>
    </div>
  );
}
