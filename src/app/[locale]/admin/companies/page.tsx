import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { CompanyAdminActions } from "@/frontend/components/admin/company-admin-actions";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { companyListSchema, fromSearchParams } from "@/backend/admin/schema";
import { listCompanies } from "@/backend/admin/service";
import { formatDate, toDateInput } from "@/backend/format-date";

const APPROVAL_TONE = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
} as const;

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const t = await getTranslations("Admin.companies");
  const tUsers = await getTranslations("Admin.users");
  const query = companyListSchema.parse(fromSearchParams(await searchParams));
  const { items, total, pageCount } = await listCompanies(query);
  const now = new Date();
  const defaultDate = toDateInput(new Date(now.getTime() + 30 * 86_400_000));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <AdminNav active="companies" />

      <form
        method="get"
        className="border-border bg-surface flex flex-wrap items-end gap-2 rounded-2xl border p-4"
      >
        <div className="min-w-48 flex-1 space-y-1">
          <label htmlFor="q" className="block text-sm font-medium">
            {tUsers("search")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="border-border bg-surface w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="approval" className="block text-sm font-medium">
            {t("approval")}
          </label>
          <select
            id="approval"
            name="approval"
            defaultValue={query.approval ?? ""}
            className="border-border bg-surface rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">{tUsers("any")}</option>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((value) => (
              <option key={value} value={value}>
                {tUsers(`approvals.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {tUsers("filter")}
        </button>
        <Link
          href="/admin/companies"
          className="text-brand px-2 py-2 text-sm font-medium hover:underline"
        >
          {tUsers("reset")}
        </Link>
      </form>

      <p className="text-muted text-sm">{tUsers("total", { count: total })}</p>
      {items.length === 0 ? (
        <p className="text-muted">{tUsers("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((company) => {
            const until = company.subscriptionUntil
              ? new Date(company.subscriptionUntil)
              : null;
            const details = [
              company.country,
              company.industry,
              company.size,
              company.contactPerson,
            ].filter(Boolean);
            return (
              <li
                key={company.id}
                className="border-border bg-surface space-y-3 rounded-2xl border p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold break-words">
                      {company.name ?? tUsers("noCompanyName")}
                    </h2>
                    <p className="text-muted text-sm break-all">
                      {company.email}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${APPROVAL_TONE[company.approval]}`}
                  >
                    {tUsers(`approvals.${company.approval}`)}
                  </span>
                </div>
                {details.length > 0 ? (
                  <p className="text-sm">{details.join(" · ")}</p>
                ) : null}
                <p className="text-muted text-sm">
                  {[
                    t("vacancies", { count: company.vacancies }),
                    t("registered", { date: formatDate(company.createdAt) }),
                    company.userStatus === "BLOCKED"
                      ? tUsers("statuses.BLOCKED")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-sm font-medium">
                  {!until
                    ? t("subNone")
                    : until > now
                      ? t("subActive", { date: formatDate(until) })
                      : t("subExpired", { date: formatDate(until) })}
                </p>
                <CompanyAdminActions
                  companyId={company.id}
                  approval={company.approval}
                  subscriptionDate={until ? toDateInput(until) : null}
                  defaultDate={defaultDate}
                />
              </li>
            );
          })}
        </ul>
      )}
      <Pagination
        page={query.page}
        pageCount={pageCount}
        pathname="/admin/companies"
        query={{ q: query.q, approval: query.approval }}
      />
    </div>
  );
}
