import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { recentAdminLogs } from "@/backend/admin/log";
import { requireAdminPage } from "@/backend/admin/page";
import { aiStats, platformStats } from "@/backend/admin/service";
import { db } from "@/backend/db";
import { formatDate, formatDateTime } from "@/backend/format-date";
import styles from "@/frontend/components/admin/admin-studio.module.css";
import { AiLimitModalButton } from "@/frontend/components/admin/ai-limit-modal-button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("admin") };
}

function fmtCount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function usdFixed(value: number): string {
  return value.toFixed(2);
}

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const [t, tStudio, stats, ai, logs] = await Promise.all([
    getTranslations("Admin.dashboard"),
    getTranslations("AdminStudio"),
    platformStats(),
    aiStats(),
    recentAdminLogs(10),
  ]);

  const companyIds = Array.from(
    new Set(
      logs
        .filter((l) => l.targetType === "Company")
        .map((l) => l.targetId)
        .filter(Boolean),
    ),
  );
  const paymentIds = Array.from(
    new Set(
      logs
        .filter((l) => l.targetType === "Payment")
        .map((l) => l.targetId)
        .filter(Boolean),
    ),
  );

  const [resolvedCompanies, resolvedPayments] = await Promise.all([
    companyIds.length > 0
      ? db.company.findMany({
          where: { id: { in: companyIds } },
          select: { id: true, name: true, user: { select: { email: true } } },
        })
      : Promise.resolve([]),
    paymentIds.length > 0
      ? db.payment.findMany({
          where: { id: { in: paymentIds } },
          select: {
            id: true,
            amount: true,
            status: true,
            user: { select: { email: true } },
            company: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const companyNameMap = new Map(
    resolvedCompanies.map((c) => [c.id, c.name || c.user.email]),
  );
  const paymentLabelMap = new Map(
    resolvedPayments.map((p) => [
      p.id,
      `${p.amount.toLocaleString("ru-RU")} UZS · ${p.company?.name || p.user.email}`,
    ]),
  );

  const pctRaw = ai.limitUsd > 0 ? (ai.spentUsd / ai.limitUsd) * 100 : 0;
  const pctClamped = Math.min(100, Math.max(0, pctRaw));
  const pctLabel = pctRaw.toFixed(2);
  const limitLabel = `${usdFixed(ai.limitUsd)} USD`;
  const cvGenTotal = ai.tasks.CV_GEN.ok + ai.tasks.CV_GEN.failed;
  const matchTotal = ai.tasks.MATCH.ok + ai.tasks.MATCH.failed;
  const arrowGlyph = "→";

  const topKpis = [
    {
      key: "students",
      href: "/admin/users",
      label: tStudio("kpi.students"),
      value: fmtCount(stats.students),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "cvsSaved",
      href: "/admin/readiness",
      label: tStudio("kpi.cvsSaved"),
      value: fmtCount(stats.cvsSaved),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      ),
    },
    {
      key: "cvsVisible",
      href: "/admin/readiness",
      label: tStudio("kpi.cvsVisible"),
      value: fmtCount(stats.cvsVisible),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      key: "companies",
      href: "/admin/companies",
      label: tStudio("kpi.companies"),
      value: fmtCount(stats.companies),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      href: "/admin/companies",
      label: tStudio("quickCheckCompanies"),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01" />
        </svg>
      ),
    },
    {
      href: "/admin/payments",
      label: tStudio("quickViewPayments"),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
    {
      href: "/admin/complaints",
      label: tStudio("quickViewComplaints"),
      icon: (
        <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0b2017] sm:text-[30px] dark:text-[#f4fbf8]">
          {tStudio("platformStatus")}
        </h1>
      </div>

      {/* Row 1: 4 Primary Emerald KPI Cards */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {topKpis.map((item) => (
          <Link key={item.key} href={item.href} className={styles.kpiCard}>
            <div className="text-[#0c8a58] dark:text-[#34eab0]">
              {item.icon}
            </div>
            <p className="mt-2.5 text-xs font-bold text-[#35574a] dark:text-[#a8d2c1]">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#0a1f17] sm:text-[28px] dark:text-[#f4fbf8]">
              {item.value}
            </p>
          </Link>
        ))}
      </section>

      {/* Row 2: 3 Status KPI Cards (Approved, Amber Pending, Vacancies) */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Link href="/admin/companies" className={styles.kpiCard}>
          <div className="text-[#0c8a58] dark:text-[#34eab0]">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <p className="mt-2.5 text-xs font-bold text-[#35574a] dark:text-[#a8d2c1]">
            {tStudio("kpi.approved")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#0a1f17] sm:text-[28px] dark:text-[#f4fbf8]">
            {fmtCount(stats.companiesApproved)}
          </p>
        </Link>

        <Link href="/admin/companies" className={styles.kpiCardAmber}>
          <div className="text-[#c97a16] dark:text-[#fbbf24]">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="mt-2.5 text-xs font-bold text-[#7a4f12] dark:text-[#fcd34d]">
            {tStudio("kpi.pending")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#a85c08] sm:text-[28px] dark:text-[#fbbf24]">
            {fmtCount(stats.companiesPending)}
          </p>
        </Link>

        <Link href="/admin/vacancies" className={styles.kpiCard}>
          <div className="text-[#0c8a58] dark:text-[#34eab0]">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <p className="mt-2.5 text-xs font-bold text-[#35574a] dark:text-[#a8d2c1]">
            {tStudio("kpi.vacancies")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#0a1f17] sm:text-[28px] dark:text-[#f4fbf8]">
            {fmtCount(stats.vacancies)}
          </p>
        </Link>
      </section>

      {/* Row 3: Recent Actions Table + AI Usage Progress Card */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: So'nggi amallar */}
        <div className={`${styles.panel} p-5`}>
          <h2 className="text-[16px] font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
            {tStudio("recentActions")}
          </h2>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#dfeee6] dark:border-[#164a35]">
            <div className="grid grid-cols-[1fr_auto] gap-3 bg-[#ebf8f1] px-4 py-2.5 text-xs font-extrabold text-[#2a4c3e] dark:bg-[#0c3525] dark:text-[#9ed0bc]">
              <span>{tStudio("colAction")}</span>
              <span>{tStudio("colTime")}</span>
            </div>

            {logs.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[#5b7a6d] dark:text-[#86b29f]">
                {tStudio("noActions")}
              </p>
            ) : (
              <ul className="divide-y divide-[#e6f3ec] dark:divide-[#133e2c]">
                {logs.map((log) => {
                  const rawTarget =
                    log.details.target ?? log.details.professionName ?? log.targetId;
                  const target =
                    log.targetType === "Company"
                      ? (companyNameMap.get(log.targetId) ?? String(rawTarget))
                      : String(rawTarget);
                  let actionText: string;
                  if (log.targetType === "Payment") {
                    const resolvedPay =
                      paymentLabelMap.get(log.targetId) ??
                      String(log.details.reference ?? log.targetId);
                    actionText = `${tStudio("nav.payments")}: ${resolvedPay}`;
                  } else if (log.targetType === "Vacancy") {
                    actionText = `${tStudio("nav.vacancies")}: ${target}`;
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
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-[#f5fbf8] dark:hover:bg-[#08261b]"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e6f7ef] text-[#0c8a58] dark:bg-[#0e3b29] dark:text-[#34eab0]">
                          {log.targetType === "Payment" ? (
                            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                          ) : log.targetType === "Company" ? (
                            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                              <path d="M9 22v-4h6v4" />
                            </svg>
                          ) : (
                            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate font-semibold text-[#10291f] dark:text-[#e7f8ef]">
                          {actionText}
                        </span>
                      </div>

                      <span className="shrink-0 font-medium text-[#5e7d70] dark:text-[#86b29f]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: AI sarfi */}
        <div className={`${styles.panel} flex flex-col justify-between p-5`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#0c8a58] dark:text-[#34eab0]">
                <svg aria-hidden width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="10" x="5" y="7" rx="2" />
                  <path d="M12 7V4" />
                  <path d="M9 11h.01M15 11h.01" />
                  <path d="M9 14h6" />
                </svg>
              </span>
              <h2 className="text-[16px] font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                {tStudio("aiUsage")}
              </h2>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-bold text-[#4a6a5d] dark:text-[#98c1b0]">
                {tStudio("monthlyLimit")}
              </span>
              <span className="text-sm font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                {limitLabel}
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className={`${styles.progressTrack} mt-2.5`}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.max(4, pctClamped)}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-medium text-[#547467] dark:text-[#98c1b0]">
              {tStudio("spentLine", {
                spent: usdFixed(ai.spentUsd),
                pct: pctLabel,
              })}
            </p>

            {/* Requests breakdown */}
            <div className="mt-5">
              <p className="text-xs font-extrabold text-[#10291f] dark:text-[#e6f7ee]">
                {tStudio("requestsTitle")}
              </p>
              <div className="mt-2.5 divide-y divide-[#e4f1eb] rounded-xl border border-[#dfeee6] bg-[#f7fcfa] dark:divide-[#154531] dark:border-[#164a35] dark:bg-[#072117]">
                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-2 font-semibold text-[#234135] dark:text-[#d4ede1]">
                    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0c8a58] dark:text-[#34eab0]">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                    <span>{tStudio("cvGenLabel")}</span>
                  </span>
                  <span className="font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                    {fmtCount(cvGenTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-2 font-semibold text-[#234135] dark:text-[#d4ede1]">
                    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0c8a58] dark:text-[#34eab0]">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span>{tStudio("matchLabel")}</span>
                  </span>
                  <span className="font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                    {fmtCount(matchTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AiLimitModalButton initial={ai.limitUsd} />
        </div>
      </section>

      {/* Row 4: Tezkor amallar (Quick Actions) */}
      <section className="space-y-3">
        <h2 className="text-[16px] font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
          {tStudio("quickActionsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {quickActions.map((qa) => (
            <Link key={qa.href} href={qa.href} className={styles.quickActionCard}>
              <span className="flex items-center gap-3">
                <span className="text-[#0c8a58] dark:text-[#34eab0]">
                  {qa.icon}
                </span>
                <span className="text-xs font-extrabold text-[#0c241b] sm:text-[13px] dark:text-[#eefaf3]">
                  {qa.label}
                </span>
              </span>
              <span className="text-sm font-bold text-[#0c8a58] dark:text-[#34eab0]">
                {arrowGlyph}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
