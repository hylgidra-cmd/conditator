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
  PENDING: "border border-primary/30 bg-primary-soft text-primary-text",
  APPROVED: "border border-emerald-500/30 bg-success-soft text-success",
  REJECTED: "border border-red-500/30 bg-danger-soft text-danger",
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
    <div className="page-x font-ui max-w-5xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card shadow-soft relative space-y-4 overflow-hidden rounded-2xl border p-6 sm:p-8">
        <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <div className="relative z-10">
          <AdminNav active="companies" />
        </div>
      </div>

      <form
        method="get"
        className="border-line bg-card shadow-soft flex flex-wrap items-end gap-3 rounded-2xl border p-5"
      >
        <div className="min-w-48 flex-1 space-y-1.5">
          <label htmlFor="q" className="text-text block text-xs font-bold">
            {tUsers("search")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="border-line bg-canvas text-text focus:border-primary w-full rounded-xl border px-3.5 py-2 text-sm transition-colors outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="approval"
            className="text-text block text-xs font-bold"
          >
            {t("approval")}
          </label>
          <select
            id="approval"
            name="approval"
            defaultValue={query.approval ?? ""}
            className="border-line bg-canvas text-text focus:border-primary rounded-xl border px-3 py-2 text-sm transition-colors outline-none"
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
          className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-sm font-bold transition-colors"
        >
          {tUsers("filter")}
        </button>
        <Link
          href="/admin/companies"
          className="text-primary-text px-2 py-2 text-sm font-bold hover:underline"
        >
          {tUsers("reset")}
        </Link>
      </form>

      <p className="text-subtle text-sm font-medium">
        {tUsers("total", { count: total })}
      </p>
      {items.length === 0 ? (
        <div className="border-line bg-card shadow-soft rounded-2xl border p-10 text-center">
          <p className="text-subtle text-sm">{tUsers("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
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
                className="border-line bg-card shadow-soft hover:border-primary/40 space-y-3 rounded-2xl border p-6 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-text font-extrabold break-words">
                      {company.name ?? tUsers("noCompanyName")}
                    </h2>
                    <p className="text-subtle text-sm break-all">
                      {company.email}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${APPROVAL_TONE[company.approval]}`}
                  >
                    {tUsers(`approvals.${company.approval}`)}
                  </span>
                </div>
                {details.length > 0 ? (
                  <p className="text-text text-sm">{details.join(" · ")}</p>
                ) : null}
                <p className="text-subtle text-sm">
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
                <p className="text-text text-sm font-semibold">
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
