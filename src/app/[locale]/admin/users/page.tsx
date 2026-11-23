import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { UserStatusButton } from "@/frontend/components/admin/user-status-button";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { fromSearchParams, userListSchema } from "@/backend/admin/schema";
import { listUsers } from "@/backend/admin/service";
import { formatDate } from "@/backend/format-date";

const SELECT =
  "border-line bg-canvas text-text focus:border-primary rounded-xl border px-3 py-2 text-sm outline-none transition-colors";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const t = await getTranslations("Admin.users");
  const tRoles = await getTranslations("Account.roles");
  const query = userListSchema.parse(fromSearchParams(await searchParams));
  const { items, total, pageCount } = await listUsers(query);

  return (
    <div className="page-x font-ui max-w-5xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card shadow-soft relative space-y-4 overflow-hidden rounded-2xl border p-6 sm:p-8">
        <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <div className="relative z-10">
          <AdminNav active="users" />
        </div>
      </div>

      {/* Oddiy GET forma: filtrlar URL da, ro'yxat serverda sahifalanadi. */}
      <form
        method="get"
        className="border-line bg-card shadow-soft flex flex-wrap items-end gap-3 rounded-2xl border p-5"
      >
        <div className="min-w-48 flex-1 space-y-1.5">
          <label htmlFor="q" className="text-text block text-xs font-bold">
            {t("search")}
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
          <label htmlFor="role" className="text-text block text-xs font-bold">
            {t("role")}
          </label>
          <select
            id="role"
            name="role"
            defaultValue={query.role ?? ""}
            className={SELECT}
          >
            <option value="">{t("any")}</option>
            {(["STUDENT", "COMPANY", "ADMIN"] as const).map((role) => (
              <option key={role} value={role}>
                {tRoles(role)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-text block text-xs font-bold">
            {t("status")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className={SELECT}
          >
            <option value="">{t("any")}</option>
            <option value="ACTIVE">{t("statuses.ACTIVE")}</option>
            <option value="BLOCKED">{t("statuses.BLOCKED")}</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-sm font-bold transition-colors"
        >
          {t("filter")}
        </button>
        <Link
          href="/admin/users"
          className="text-primary-text px-2 py-2 text-sm font-bold hover:underline"
        >
          {t("reset")}
        </Link>
      </form>

      <p className="text-subtle text-sm font-medium">
        {t("total", { count: total })}
      </p>
      {items.length === 0 ? (
        <div className="border-line bg-card shadow-soft rounded-2xl border p-10 text-center">
          <p className="text-subtle text-sm">{t("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((user) => (
            <li
              key={user.id}
              className="border-line bg-card shadow-soft hover:border-primary/40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 transition-colors"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-text font-bold break-all">{user.email}</p>
                <p className="text-subtle flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  <span>{tRoles(user.role)}</span>
                  <span
                    className={
                      user.status === "BLOCKED"
                        ? "text-danger font-bold"
                        : "text-success font-semibold"
                    }
                  >
                    {t(`statuses.${user.status}`)}
                  </span>
                  <span>{user.verified ? t("verified") : t("unverified")}</span>
                  {user.role === "STUDENT" ? (
                    <span>
                      {user.cvVisible
                        ? t("cvVisible")
                        : user.cvSaved
                          ? t("cvSaved")
                          : t("noCv")}
                    </span>
                  ) : null}
                  {user.role === "COMPANY" ? (
                    <span>
                      {user.companyName ?? t("noCompanyName")} ·{" "}
                      {t(
                        `approvals.${user.companyApproval ?? "PENDING"}` as "approvals.PENDING",
                      )}
                    </span>
                  ) : null}
                  <span>
                    {t("created", { date: formatDate(user.createdAt) })}
                  </span>
                </p>
              </div>
              {user.role !== "ADMIN" ? (
                <UserStatusButton
                  userId={user.id}
                  status={user.status}
                  email={user.email}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={query.page}
        pageCount={pageCount}
        pathname="/admin/users"
        query={{ q: query.q, role: query.role, status: query.status }}
      />
    </div>
  );
}
