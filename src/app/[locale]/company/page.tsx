import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { publicCompany } from "@/backend/company/profile";
import { formatDate } from "@/backend/format-date";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import { CompanyLogo } from "@/frontend/components/company/company-logo";
import { CompanyProfileForm } from "@/frontend/components/company/company-profile-form";
import { CompanySubscribeButton } from "@/frontend/components/company/company-subscription-plans";
import { Reveal } from "@/frontend/components/ds/motion";
import { UsersIcon } from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Company");
  return { title: t("title") };
}

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
  const hasActiveAbuna =
    access.subscriptionActive ||
    (await isCompanySubscribedOrUnlocked(company.id));

  const studentsLinkLabel = "Nomzodlar bazasi (CV lar)";
  const statsLinkLabel = "Statistika";
  const subscribeCtaTitle =
    "Nomzodlarning kontaktlari va PDF rezyumelarini ko'rish uchun Obuna oling";
  const subscribeCtaDesc =
    "Obunasiz barcha nomzodlarning mutaxassisligi, ko'nikmalari va AI bahosini (%) ko'rasiz. Obuna sotib olishingiz bilan (14 900 so'm) telefon, Telegram, email, PDF yuklash va chat to'liq ochiladi.";
  const allPlansLinkLabel = "Barcha tariflar →";
  const buySubBtnLabel = "🔓 Obuna sotib olish (14 900 so'm)";
  const extendSubBtnLabel = "✨ Obunani uzaytirish";

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
                href="/company/students"
                className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors"
              >
                <UsersIcon size={14} />
                {studentsLinkLabel}
              </Link>
              <Link
                href="/company/stats"
                className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors"
              >
                {statsLinkLabel}
              </Link>
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

      {/* Prominent Company Subscription Purchase Banner */}
      {!hasActiveAbuna ? (
        <Reveal delay={75}>
          <section className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-[#051812] via-[#08261D] to-[#0D3D31] p-6 text-white shadow-[0_20px_50px_-15px_rgb(5,24,18,0.55)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xl space-y-1.5">
                <h2 className="text-base font-black text-white sm:text-lg">
                  {subscribeCtaTitle}
                </h2>
                <p className="text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                  {subscribeCtaDesc}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <CompanySubscribeButton
                  variant="dark"
                  label={buySubBtnLabel}
                />
                <Link
                  href="/company/billing"
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-white/20"
                >
                  {allPlansLinkLabel}
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}

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
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium ${hasActiveAbuna ? TONE.APPROVED : "border-line bg-card-cool/50 text-subtle"}`}
          >
            <span>
              {hasActiveAbuna
                ? company.subscriptionUntil &&
                  company.subscriptionUntil > new Date()
                  ? t("status.subscriptionActive", {
                      date: formatDate(company.subscriptionUntil),
                    })
                  : "Kompaniya Obunasi faol"
                : t("status.subscriptionInactive")}
            </span>
            <CompanySubscribeButton
              variant="compact"
              label={hasActiveAbuna ? extendSubBtnLabel : buySubBtnLabel}
            />
          </div>
          {company.approval === "APPROVED" ? (
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/company/students"
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all"
              >
                <UsersIcon size={14} />
                {studentsLinkLabel}
              </Link>
              <Link
                href="/company/vacancies/new"
                className="border-line bg-canvas text-text hover:border-primary rounded-2xl border px-5 py-2.5 text-xs font-bold transition-colors"
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
