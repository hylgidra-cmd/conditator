import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { UserStatusButton } from "@/frontend/components/admin/user-status-button";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/backend/admin/page";
import { fromSearchParams, userListSchema } from "@/backend/admin/schema";
import { listUsers } from "@/backend/admin/service";
import { formatDate } from "@/backend/format-date";

const SELECT = "border-border bg-surface rounded-lg border px-3 py-2 text-sm";

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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <AdminNav active="users" />

      {/* Oddiy GET forma: filtrlar URL da, ro'yxat serverda sahifalanadi. */}
      <form
        method="get"
        className="border-border bg-surface flex flex-wrap items-end gap-2 rounded-2xl border p-4"
      >
        <div className="min-w-48 flex-1 space-y-1">
          <label htmlFor="q" className="block text-sm font-medium">
            {t("search")}
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
          <label htmlFor="role" className="block text-sm font-medium">
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
        <div className="space-y-1">
          <label htmlFor="status" className="block text-sm font-medium">
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
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-semibold"
        >
          {t("filter")}
        </button>
        <Link
          href="/admin/users"
          className="text-brand px-2 py-2 text-sm font-medium hover:underline"
        >
          {t("reset")}
        </Link>
      </form>

      <p className="text-muted text-sm">{t("total", { count: total })}</p>
      {items.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((user) => (
            <li
              key={user.id}
              className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-semibold break-all">{user.email}</p>
                <p className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  <span>{tRoles(user.role)}</span>
                  <span
                    className={
                      user.status === "BLOCKED"
                        ? "font-semibold text-red-700"
                        : ""
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
