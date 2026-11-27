import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { AdminVacancyActions } from "@/frontend/components/admin/vacancy-actions";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";

const PAGE_SIZE = 50;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-success-soft text-success border border-emerald-500/30",
  CLOSED: "bg-primary-soft text-primary-text border border-primary/30",
  CANCELLED: "bg-danger-soft text-danger border border-red-500/30",
};

export default async function AdminVacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminPage();
  const t = await getTranslations("Admin.vacancies");
  const sp = await searchParams;
  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [vacancies, total] = await Promise.all([
    db.vacancy.findMany({
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.vacancy.count(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-x font-ui max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card/85 shadow-float relative space-y-4 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
        />
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
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
          <p className="text-subtle text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="border-line bg-card/90 shadow-soft overflow-x-auto rounded-3xl border backdrop-blur-md">
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
      <Pagination
        page={page}
        pageCount={pageCount}
        pathname="/admin/vacancies"
      />
    </div>
  );
}
