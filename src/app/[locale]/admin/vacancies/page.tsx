import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CLOSED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  CANCELLED: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default async function AdminVacanciesPage() {
  await requireAdminPage();
  const t = await getTranslations("Admin.vacancies");

  const vacancies = await db.vacancy.findMany({
    include: {
      company: {
        select: {
          id: true,
          name: true,
          contactPerson: true,
          approval: true,
          user: { select: { email: true } },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <AdminNav active="vacancies" />

      {vacancies.length === 0 ? (
        <div className="border-border bg-surface rounded-2xl border p-8 text-center">
          <p className="text-muted text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-border bg-muted/20 border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">{t("title")}</th>
                <th className="px-4 py-3 font-bold">{t("company")}</th>
                <th className="px-4 py-3 font-bold">{t("poster")}</th>
                <th className="px-4 py-3 font-bold">{t("status")}</th>
                <th className="px-4 py-3 font-bold">{t("applications")}</th>
                <th className="px-4 py-3 font-bold">{t("created")}</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {vacancies.map((v) => (
                <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3 font-semibold">{v.title}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.company.name || "—"}</div>
                    <div className="text-muted text-xs">
                      {v.company.approval}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium">
                      {v.company.contactPerson || "—"}
                    </div>
                    <div className="text-muted text-xs">
                      {v.company.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        STATUS_BADGE[v.status] ?? "bg-muted/20"
                      }`}
                    >
                      {t(`statuses.${v.status}` as "statuses.ACTIVE")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums">
                    {v._count.applications}
                  </td>
                  <td className="text-muted px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(v.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/vacancies/${v.id}`}
                      className="text-brand text-xs font-bold hover:underline"
                    >
                      {t("openVacancy")}
                    </Link>
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
