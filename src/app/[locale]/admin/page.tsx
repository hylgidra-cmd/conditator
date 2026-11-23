import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("admin") };
}
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { AiLimitForm } from "@/frontend/components/admin/ai-limit-form";
import { recentAdminLogs } from "@/backend/admin/log";
import { requireAdminPage } from "@/backend/admin/page";
import { aiStats, platformStats } from "@/backend/admin/service";
import { formatDate, formatDateTime } from "@/backend/format-date";

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
    <div className="page-x font-ui max-w-5xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card relative space-y-4 overflow-hidden rounded-xl border p-6 sm:p-8">
        <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <div className="relative z-10">
          <AdminNav active="dashboard" />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-text text-lg font-extrabold">{t("statsTitle")}</h2>
        <dl className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {tiles.map(([key, value]) => (
            <div
              key={key}
              className="border-line bg-card hover:border-primary/40 rounded-xl border p-5 transition-colors"
            >
              <dt className="text-subtle text-xs font-semibold">
                {t(`stats.${key}`)}
              </dt>
              <dd className="text-primary-text mt-1.5 text-2xl font-extrabold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-line bg-card space-y-5 rounded-xl border p-6">
        <div>
          <h2 className="text-text text-lg font-extrabold">{t("ai.title")}</h2>
          <p className="text-subtle text-xs">
            {t("ai.since", { date: formatDate(ai.monthStart) })}
          </p>
        </div>
        <dl className="grid gap-3.5 sm:grid-cols-3">
          <div className="border-line bg-canvas/70 rounded-2xl border p-4">
            <dt className="text-subtle text-xs font-semibold">
              {t("ai.requests")}
            </dt>
            <dd className="text-text mt-1 text-xl font-extrabold tabular-nums">
              {ai.requests}
            </dd>
          </div>
          <div className="border-line bg-canvas/70 rounded-2xl border p-4">
            <dt className="text-subtle text-xs font-semibold">
              {t("ai.spent")}
            </dt>
            <dd className="text-text mt-1 text-xl font-extrabold tabular-nums">
              {t("ai.spentValue", {
                spent: usd(ai.spentUsd),
                limit: usd(ai.limitUsd),
              })}
            </dd>
          </div>
          <div className="border-line bg-canvas/70 rounded-2xl border p-4">
            <dt className="text-subtle text-xs font-semibold">
              {t("ai.state")}
            </dt>
            <dd
              className={`mt-1 text-sm font-bold ${ai.limitReached ? "text-danger" : "text-success"}`}
            >
              {ai.limitReached ? t("ai.limitReached") : t("ai.limitOk")}
            </dd>
          </div>
        </dl>
        <ul className="text-text space-y-1.5 text-sm">
          {(["CV_GEN", "MATCH"] as const).map((task) => (
            <li key={task} className="flex flex-wrap gap-x-2">
              <span className="font-bold">{t(`ai.tasks.${task}`)}</span>
              <span className="text-subtle">
                {t("ai.taskLine", {
                  ok: ai.tasks[task].ok,
                  failed: ai.tasks[task].failed,
                  cost: usd(ai.tasks[task].costUsd),
                })}
              </span>
            </li>
          ))}
        </ul>
        <AiLimitForm initial={ai.limitUsd} />
      </section>

      <section className="border-line bg-card space-y-4 rounded-xl border p-6">
        <h2 className="text-text text-lg font-extrabold">{t("logs.title")}</h2>
        {logs.length === 0 ? (
          <p className="text-subtle text-sm">{t("logs.empty")}</p>
        ) : (
          <ul className="border-line bg-canvas/60 divide-line divide-y rounded-2xl border text-sm">
            {logs.map((log) => {
              const target = String(
                log.details.name ??
                  log.details.email ??
                  log.details.title ??
                  log.details.externalId ??
                  log.targetId,
              );
              let actionText: string;
              if (log.targetType === "Payment") {
                const amount =
                  typeof log.details.amount === "number"
                    ? `${log.details.amount.toLocaleString("en-US")} so'm`
                    : "";
                const ref = log.details.externalId
                  ? `#${String(log.details.externalId)}`
                  : log.targetId.slice(-6);
                actionText =
                  log.details.decision === "APPROVE"
                    ? `To'lov tasdiqlandi: ${ref}${amount ? ` (${amount})` : ""}`
                    : `To'lov rad etildi: ${ref}${amount ? ` (${amount})` : ""}`;
              } else if (log.targetType === "Vacancy") {
                actionText = log.details.deleted
                  ? `Vakansiya o'chirildi: ${target}`
                  : `Vakansiya holati (${String(log.details.newStatus ?? "")}): ${target}`;
              } else {
                const rawTo = log.details.to;
                const formattedTo =
                  log.action === "SUBSCRIPTION_SET" &&
                  (typeof rawTo === "string" || rawTo instanceof Date) &&
                  !Number.isNaN(new Date(rawTo).getTime())
                    ? formatDate(rawTo)
                    : String(rawTo ?? "—");
                actionText = t(`logs.actions.${log.action}`, {
                  target,
                  to: formattedTo,
                });
              }
              return (
                <li
                  key={log.id}
                  className="hover:bg-card/60 flex flex-wrap justify-between gap-2 px-4 py-3 transition-colors"
                >
                  <span className="text-text min-w-0 break-words">
                    {actionText}
                  </span>
                  <span className="text-subtle text-xs">
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
