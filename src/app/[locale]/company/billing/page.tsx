import { getTranslations } from "next-intl/server";
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/company"
          className="text-brand text-sm font-semibold hover:underline"
        >
          {t("back")}
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-surface space-y-2 rounded-2xl border p-5 shadow-sm">
          <p className="text-sm font-semibold">
            {access.subscriptionActive && company.subscriptionUntil
              ? t("subActive", { date: formatDate(company.subscriptionUntil) })
              : t("subInactive")}
          </p>
        </div>
        <div className="border-border bg-surface space-y-2 rounded-2xl border p-5 shadow-sm">
          <h2 className="font-bold">{t("unlockTitle")}</h2>
          <p className="text-muted text-sm">{t("unlockDesc")}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("historyTitle")}</h2>
        {payments.length === 0 ? (
          <p className="text-muted text-sm">{t("empty")}</p>
        ) : (
          <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-border border-b text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">{t("purpose")}</th>
                  <th className="px-4 py-3">{t("provider")}</th>
                  <th className="px-4 py-3">{t("amount")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.purpose}</td>
                    <td className="px-4 py-3">{p.provider}</td>
                    <td className="px-4 py-3 font-semibold">
                      {p.amount.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {p.status}
                    </td>
                    <td className="text-muted px-4 py-3 text-xs">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
