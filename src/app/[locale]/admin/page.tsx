import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { AiLimitForm } from "@/components/admin/ai-limit-form";
import { recentAdminLogs } from "@/lib/admin/log";
import { requireAdminPage } from "@/lib/admin/page";
import { aiStats, platformStats } from "@/lib/admin/service";
import { formatDate, formatDateTime } from "@/lib/format-date";

const usd = (value: number) => value.toFixed(value < 1 ? 4 : 2);

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const t = await getTranslations("Admin.dashboard");
  const [stats, ai, logs] = await Promise.all([
    platformStats(),
    aiStats(),
    recentAdminLogs(20),
  ]);

  const tiles = [
    ["students", stats.students],
    ["cvsSaved", stats.cvsSaved],
    ["cvsVisible", stats.cvsVisible],
    ["companies", stats.companies],
    ["companiesApproved", stats.companiesApproved],
    ["companiesPending", stats.companiesPending],
    ["vacancies", stats.vacancies],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <AdminNav active="dashboard" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("statsTitle")}</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map(([key, value]) => (
            <div
              key={key}
              className="border-border bg-surface rounded-2xl border p-4 shadow-sm"
            >
              <dt className="text-muted text-sm">{t(`stats.${key}`)}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-border bg-surface space-y-4 rounded-2xl border p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">{t("ai.title")}</h2>
          <p className="text-muted text-sm">
            {t("ai.since", { date: formatDate(ai.monthStart) })}
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-muted text-sm">{t("ai.requests")}</dt>
            <dd className="text-xl font-bold tabular-nums">{ai.requests}</dd>
          </div>
          <div>
            <dt className="text-muted text-sm">{t("ai.spent")}</dt>
            <dd className="text-xl font-bold tabular-nums">
              {t("ai.spentValue", {
                spent: usd(ai.spentUsd),
                limit: usd(ai.limitUsd),
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-sm">{t("ai.state")}</dt>
            <dd
              className={`font-semibold ${ai.limitReached ? "text-red-700" : "text-green-700"}`}
            >
              {ai.limitReached ? t("ai.limitReached") : t("ai.limitOk")}
            </dd>
          </div>
        </dl>
        <ul className="space-y-1 text-sm">
          {(["CV_GEN", "MATCH"] as const).map((task) => (
            <li key={task} className="flex flex-wrap gap-x-2">
              <span className="font-medium">{t(`ai.tasks.${task}`)}</span>
              {t("ai.taskLine", {
                ok: ai.tasks[task].ok,
                failed: ai.tasks[task].failed,
                cost: usd(ai.tasks[task].costUsd),
              })}
            </li>
          ))}
        </ul>
        <AiLimitForm initial={ai.limitUsd} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("logs.title")}</h2>
        {logs.length === 0 ? (
          <p className="text-muted text-sm">{t("logs.empty")}</p>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y rounded-2xl border text-sm">
            {logs.map((log) => {
              const target = String(
                log.details.name ?? log.details.email ?? log.targetId,
              );
              return (
                <li
                  key={log.id}
                  className="flex flex-wrap justify-between gap-2 px-4 py-2"
                >
                  <span className="min-w-0 break-words">
                    {t(`logs.actions.${log.action}`, {
                      target,
                      to:
                        log.action === "SUBSCRIPTION_SET"
                          ? formatDate(String(log.details.to))
                          : String(log.details.to ?? ""),
                    })}
                  </span>
                  <span className="text-muted text-xs">
                    {formatDateTime(log.createdAt)}
                    {log.admin ? ` · ${log.admin}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
