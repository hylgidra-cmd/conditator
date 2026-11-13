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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{t("payments.title")}</h1>
        <AdminNav active="payments" />
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-surface rounded-2xl border p-4 shadow-sm">
          <p className="text-muted text-xs">{t("payments.totalRevenue")}</p>
          <p className="mt-1 text-2xl font-bold">
            {totalRevenue.toLocaleString("en-US")}
          </p>
        </div>
        <div className="border-border bg-surface rounded-2xl border p-4 shadow-sm">
          <p className="text-muted text-xs">{t("payments.completedCount")}</p>
          <p className="mt-1 text-2xl font-bold">{completedAgg._count._all}</p>
        </div>
        <div className="border-border bg-surface rounded-2xl border p-4 shadow-sm">
          <p className="text-muted text-xs">{t("payments.pendingCount")}</p>
          <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
        </div>
      </section>

      {payments.length === 0 ? (
        <p className="text-muted text-sm">{t("payments.empty")}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-border border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3">{t("payments.user")}</th>
                <th className="px-4 py-3">{t("payments.purpose")}</th>
                <th className="px-4 py-3">{t("payments.provider")}</th>
                <th className="px-4 py-3">{t("payments.amount")}</th>
                <th className="px-4 py-3">{t("payments.status")}</th>
                <th className="px-4 py-3">{t("payments.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {p.company?.name ?? p.user.email}
                    </p>
                    <p className="text-muted text-xs">{p.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{p.purpose}</td>
                  <td className="px-4 py-3 text-xs">{p.provider}</td>
                  <td className="px-4 py-3 font-semibold">
                    {p.amount.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{p.status}</td>
                  <td className="text-muted px-4 py-3 text-xs">
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
