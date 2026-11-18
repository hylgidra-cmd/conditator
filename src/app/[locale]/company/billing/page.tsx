import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Company.billing");
  return { title: t("title") };
}
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formatDate, formatDateTime } from "@/backend/format-date";

export const dynamic = "force-dynamic";

export default async function CompanyBillingPage() {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company.billing");
  const access = companyAccess(company);

  const payments = await db.payment.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const buyAbunaTitle = "Kompaniya Abunasini faollashtirish (15 kun)";
  const buyAbunaDesc =
    "Faol Abuna bilan barcha 🌟 Mukammal ishlangan CV lar (80–100%), nomzodlarning telefon/email kontaktlari, PDF rezyumelari va AI saralash imkoniyatlari to'liq ochiladi. 80% dan pastroq CV lar esa abunasiz ham ochiq ko'rinadi.";

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
            <Link
              href="/company"
              className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors"
            >
              <ArrowLeftIcon size={14} />
              {t("back")}
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal delay={75}>
        <section className="grid gap-4 sm:grid-cols-2">
          <div
            className={`space-y-2 rounded-3xl border p-6 backdrop-blur-md ${
              access.subscriptionActive
                ? "border-emerald-500/30 bg-success-soft text-success"
                : "border-line bg-card/90 text-text shadow-soft"
            }`}
          >
            <p className="text-sm font-bold">
              {access.subscriptionActive && company.subscriptionUntil
                ? t("subActive", { date: formatDate(company.subscriptionUntil) })
                : t("subInactive")}
            </p>
          </div>
          <div className="border-line bg-card/90 shadow-soft space-y-2 rounded-3xl border p-6 backdrop-blur-md">
            <h2 className="text-text font-extrabold">{t("unlockTitle")}</h2>
            <p className="text-subtle text-sm leading-relaxed">
              {t("unlockDesc")}
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={150}>
        <section className="border-line bg-card/90 shadow-soft space-y-4 rounded-3xl border p-6 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-text text-lg font-extrabold">
              {buyAbunaTitle}
            </h2>
            <p className="text-subtle text-sm leading-relaxed">
              {buyAbunaDesc}
            </p>
          </div>
          <ManualCardPaymentBox purpose="VACANCY_UNLOCK" amountUzs={14999} />
        </section>
      </Reveal>

      <Reveal delay={150}>
        <section className="border-line bg-card/90 shadow-soft space-y-4 rounded-3xl border p-6 backdrop-blur-md">
          <h2 className="text-text text-lg font-extrabold">
            {t("historyTitle")}
          </h2>
          {payments.length === 0 ? (
            <p className="text-subtle text-sm">{t("empty")}</p>
          ) : (
            <div className="border-line bg-canvas/60 overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-line text-subtle border-b text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">{t("purpose")}</th>
                    <th className="px-4 py-3">{t("provider")}</th>
                    <th className="px-4 py-3">{t("amount")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-card/60 transition-colors">
                      <td className="text-text px-4 py-3 font-semibold">
                        {p.purpose}
                      </td>
                      <td className="text-subtle px-4 py-3">{p.provider}</td>
                      <td className="text-text px-4 py-3 font-bold">
                        {p.amount.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">
                        <span className="border-line bg-card rounded-full border px-2.5 py-0.5">
                          {p.status}
                        </span>
                      </td>
                      <td className="text-subtle px-4 py-3 text-xs">
                        {formatDateTime(p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
