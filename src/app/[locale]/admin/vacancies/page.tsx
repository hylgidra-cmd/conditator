import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { AdminVacancyActions } from "@/frontend/components/admin/vacancy-actions";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-success-soft text-success border border-emerald-500/30",
  CLOSED: "bg-primary-soft text-primary-text border border-primary/30",
  CANCELLED: "bg-danger-soft text-danger border border-red-500/30",
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
    <div className="page-x font-ui max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card shadow-soft relative space-y-4 overflow-hidden rounded-2xl border p-6 sm:p-8">
        <div className="relative z-10">
          <h1 className="text-h2 text-text font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-subtle mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <div className="relative z-10">
          <AdminNav active="vacancies" />
        </div>
      </div>

      {vacancies.length === 0 ? (
        <div className="border-line bg-card shadow-soft rounded-2xl border p-10 text-center">
          <p className="text-subtle text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="border-line bg-card shadow-soft overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-line bg-canvas/60 text-subtle border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3.5 font-bold">{t("title")}</th>
                <th className="px-4 py-3.5 font-bold">{t("company")}</th>
                <th className="px-4 py-3.5 font-bold">{t("poster")}</th>
                <th className="px-4 py-3.5 font-bold">{t("status")}</th>
                <th className="px-4 py-3.5 font-bold">{t("applications")}</th>
                <th className="px-4 py-3.5 font-bold">{t("created")}</th>
                <th className="px-4 py-3.5 text-right font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {vacancies.map((v) => (
                <tr key={v.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="text-text px-4 py-3.5 font-bold">{v.title}</td>
                  <td className="px-4 py-3.5">
                    <div className="text-text font-semibold">
                      {v.company.name || "—"}
                    </div>
                    <div className="text-subtle text-xs">
                      {v.company.approval}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-text text-xs font-medium">
                      {v.company.contactPerson || "—"}
                    </div>
                    <div className="text-subtle text-xs">
                      {v.company.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        STATUS_BADGE[v.status] ?? "bg-card-cool text-subtle"
                      }`}
                    >
                      {t(`statuses.${v.status}` as "statuses.ACTIVE")}
                    </span>
                  </td>
                  <td className="text-primary-text px-4 py-3.5 font-extrabold tabular-nums">
                    {v._count.applications}
                  </td>
                  <td className="text-subtle px-4 py-3.5 text-xs whitespace-nowrap">
                    {formatDate(v.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/vacancies/${v.id}`}
                        className="text-primary-text text-xs font-bold hover:underline"
                      >
                        {t("openVacancy")}
                      </Link>
                      <AdminVacancyActions
                        vacancyId={v.id}
                        initialStatus={v.status}
                      />
                    </div>
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
