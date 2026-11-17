import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDateTime } from "@/backend/format-date";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdminPage();
  const t = await getTranslations("Admin");

  const [payments, completedAgg, pendingCount] = await Promise.all([
    db.payment.findMany({
      include: {
        user: { select: { email: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.payment.count({ where: { status: "PENDING" } }),
  ]);

  const totalRevenue = completedAgg._sum.amount ?? 0;

  return (
    <div className="page-x font-ui max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card/85 shadow-float relative space-y-4 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
        />
        <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
          {t("payments.title")}
        </h1>
        <div className="relative z-10">
          <AdminNav active="payments" />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-5 backdrop-blur-md">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.totalRevenue")}
          </p>
          <p className="text-primary-text mt-1.5 text-2xl font-extrabold tabular-nums">
            {totalRevenue.toLocaleString("en-US")}
          </p>
        </div>
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-5 backdrop-blur-md">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.completedCount")}
          </p>
          <p className="text-success mt-1.5 text-2xl font-extrabold tabular-nums">
            {completedAgg._count._all}
          </p>
        </div>
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-5 backdrop-blur-md">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.pendingCount")}
          </p>
          <p className="text-text mt-1.5 text-2xl font-extrabold tabular-nums">
            {pendingCount}
          </p>
        </div>
      </section>

      {payments.length === 0 ? (
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
          <p className="text-subtle text-sm">{t("payments.empty")}</p>
        </div>
      ) : (
        <div className="border-line bg-card/90 shadow-soft overflow-x-auto rounded-3xl border backdrop-blur-md">
          <table className="w-full text-left text-sm">
            <thead className="border-line bg-canvas/60 text-subtle border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3.5 font-bold">{t("payments.user")}</th>
                <th className="px-4 py-3.5 font-bold">
                  {t("payments.purpose")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("payments.provider")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("payments.amount")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("payments.status")}
                </th>
                <th className="px-4 py-3.5 font-bold">{t("payments.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-text font-bold">
                      {p.company?.name ?? p.user.email}
                    </p>
                    <p className="text-subtle text-xs">{p.user.email}</p>
                  </td>
                  <td className="text-text px-4 py-3.5 text-xs font-semibold">
                    {p.purpose}
                  </td>
                  <td className="text-subtle px-4 py-3.5 text-xs">
                    {p.provider}
                  </td>
                  <td className="text-text px-4 py-3.5 font-bold tabular-nums">
                    {p.amount.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-bold">
                    <span className="border-line bg-canvas text-primary-text rounded-full border px-2.5 py-0.5">
                      {p.status}
                    </span>
                  </td>
                  <td className="text-subtle px-4 py-3.5 text-xs">
                    {formatDateTime(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
