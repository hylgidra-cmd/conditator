import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { formatDate, formatDateTime } from "@/backend/format-date";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import { CompanySubscriptionPlans } from "@/frontend/components/company/company-subscription-plans";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Company.billing");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

function formatPaymentStatus(status: string): string {
  if (status === "COMPLETED") return "Tasdiqlangan";
  if (status === "PENDING") return "Tekshirilmoqda";
  if (status === "CANCELLED" || status === "FAILED") return "Rad etilgan";
  return status;
}

function formatPaymentPurpose(
  purpose: string,
  meta?: { planName: string | null; durationDays: number | null },
): string {
  if (meta?.planName && meta?.durationDays) {
    return `Obuna — ${meta.planName} (${meta.durationDays} kun)`;
  }
  if (purpose === "VACANCY_UNLOCK") return "Kompaniya Obunasi";
  return purpose;
}

export default async function CompanyBillingPage() {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company.billing");
  const access = companyAccess(company);
  const [unlocked, payments] = await Promise.all([
    access.subscriptionActive
      ? Promise.resolve(true)
      : isCompanySubscribedOrUnlocked(company.id),
    db.payment.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        purpose: true,
        provider: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const hasActiveAbuna = access.subscriptionActive || unlocked;

  const paymentIds = payments.map((p) => p.id);
  const metaRows =
    paymentIds.length > 0
      ? await db.$queryRaw<
          Array<{
            id: string;
            planName: string | null;
            durationDays: number | null;
          }>
        >(Prisma.sql`
          SELECT id,
            "transactionDetails"->>'planName' AS "planName",
            CASE
              WHEN ("transactionDetails"->>'durationDays') ~ '^[0-9]+$'
              THEN ("transactionDetails"->>'durationDays')::int
              ELSE NULL
            END AS "durationDays"
          FROM "Payment"
          WHERE id IN (${Prisma.join(paymentIds)})
        `)
      : [];
  const metaMap = new Map(metaRows.map((row) => [row.id, row]));

  const buyAbunaTitle = "Kompaniya Obunasi — Tarifni tanlang";
  const buyAbunaDesc =
    "Faol Obuna bilan barcha nomzodlarning to'liq ismi, telefon raqami, Telegram, emaili, PDF rezyumesi, chat va AI saralash imkoniyatlari to'liq ochiladi.";
  const variantExplainTitle = "Obunasiz va Obuna bilan farqi";
  const variantExplainDesc =
    "Obunasiz siz barcha nomzodlarning mutaxassisligi, ko'nikmalari, hududi va AI bahosini (%) ko'rasiz. Obuna faollashgach, barcha aloqa ma'lumotlari va PDF yuklash darhol ochiladi.";
  const activeFallbackText = "Kompaniya Obunasi faol";

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
              hasActiveAbuna
                ? "border-emerald-500/30 bg-success-soft text-success"
                : "border-line bg-card/90 text-text shadow-soft"
            }`}
          >
            <p className="text-sm font-bold">
              {hasActiveAbuna
                ? company.subscriptionUntil &&
                  company.subscriptionUntil > new Date()
                  ? t("subActive", {
                      date: formatDate(company.subscriptionUntil),
                    })
                  : activeFallbackText
                : t("subInactive")}
            </p>
          </div>
          <div className="border-line bg-card/90 shadow-soft space-y-2 rounded-3xl border p-6 backdrop-blur-md">
            <h2 className="text-text font-extrabold">{variantExplainTitle}</h2>
            <p className="text-subtle text-sm leading-relaxed">
              {variantExplainDesc}
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={150}>
        <section className="border-line bg-card/90 shadow-soft space-y-5 rounded-3xl border p-6 backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-text text-lg font-extrabold">
              {buyAbunaTitle}
            </h2>
            <p className="text-subtle text-sm leading-relaxed">
              {buyAbunaDesc}
            </p>
          </div>
          <CompanySubscriptionPlans />
        </section>
      </Reveal>

      <Reveal delay={225}>
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
                  {payments.map((p) => {
                    const purposeLabel = formatPaymentPurpose(
                      p.purpose,
                      metaMap.get(p.id),
                    );
                    const amountLabel = `${p.amount.toLocaleString("en-US")} so'm`;
                    const statusLabel = formatPaymentStatus(p.status);
                    const statusClass =
                      p.status === "COMPLETED"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : p.status === "PENDING"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300";

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-card/60 transition-colors"
                      >
                        <td className="text-text px-4 py-3 font-semibold">
                          {purposeLabel}
                        </td>
                        <td className="text-subtle px-4 py-3">{p.provider}</td>
                        <td className="text-text px-4 py-3 font-bold">
                          {amountLabel}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="text-subtle px-4 py-3 text-xs">
                          {formatDateTime(p.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Reveal>
    </div>
  );
}
