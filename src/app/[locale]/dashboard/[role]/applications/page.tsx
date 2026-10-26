import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar } from "@/components/ds/avatar";
import { cn, FOCUS_RING } from "@/components/ds/cn";
import { parseState, StateSwitcher } from "@/components/dashboard/page-state";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import {
  EmptyState,
  MatchMeter,
  PageHeader,
  PANEL,
  StatusBadge,
} from "@/components/dashboard/ui";
import { FileTextIcon, MapPinIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  CANDIDATE_APPLICATIONS,
  type CandidateAppStatus,
  EMPLOYER_APPLICATIONS,
  type EmployerAppStatus,
  isRole,
  vacancyById,
} from "@/lib/dashboard/mock";
import { formatDate } from "@/lib/format-date";

type Props = {
  params: Promise<{ locale: string; role: string }>;
  searchParams: Promise<{ state?: string; status?: string }>;
};

const CANDIDATE_STATUSES: CandidateAppStatus[] = [
  "sent",
  "viewed",
  "interview",
  "offer",
  "rejected",
];
const EMPLOYER_STATUSES: EmployerAppStatus[] = [
  "new",
  "review",
  "interview",
  "offer",
  "rejected",
];

export default async function ApplicationsPage({
  params,
  searchParams,
}: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale) || !isRole(role)) notFound();
  setRequestLocale(locale);
  const { state: rawState, status: rawStatus } = await searchParams;
  const state = parseState(rawState);
  const t = await getTranslations("Dashboard");
  const href = `/dashboard/${role}/applications`;
  const switcher = <StateSwitcher href={href} current={state} />;

  if (state === "loading")
    return (
      <>
        <DashboardSkeleton variant="table" label={t("loading")} />
        {switcher}
      </>
    );

  const empty = state === "empty";
  const candidateApps = empty ? [] : CANDIDATE_APPLICATIONS;
  const employerApps = empty ? [] : EMPLOYER_APPLICATIONS;
  const statuses: string[] =
    role === "candidate" ? CANDIDATE_STATUSES : EMPLOYER_STATUSES;
  const status =
    rawStatus && statuses.includes(rawStatus) ? rawStatus : undefined;
  const all: { status: string }[] =
    role === "candidate" ? candidateApps : employerApps;
  const countOf = (s?: string) =>
    s ? all.filter((a) => a.status === s).length : all.length;

  const tabs = [undefined, ...statuses].map((s) => ({
    key: s ?? "all",
    href: s ? { pathname: href, query: { status: s } } : href,
    label: s
      ? t(
          role === "candidate"
            ? `applications.candidateStatuses.${s as CandidateAppStatus}`
            : `applications.employerStatuses.${s as EmployerAppStatus}`,
        )
      : t("applications.all"),
    count: countOf(s),
    active: s === status,
  }));

  const candidateRows = candidateApps.filter(
    (a) => !status || a.status === status,
  );
  const employerRows = employerApps.filter(
    (a) => !status || a.status === status,
  );
  const rows = role === "candidate" ? candidateRows : employerRows;

  return (
    <>
      <PageHeader
        title={t(`applications.title.${role}`)}
        lead={t(`applications.lead.${role}`)}
      />
      <div className={cn(PANEL, "p-4 sm:p-6")}>
        {all.length ? (
          <nav
            aria-label={t("applications.tabsLabel")}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  tab.active
                    ? "bg-ink text-on-ink"
                    : "bg-card-cool text-text hover:bg-peach",
                  FOCUS_RING,
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    tab.active ? "bg-on-ink/15" : "bg-card",
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            ))}
          </nav>
        ) : null}

        {all.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon size={24} />}
            title={t(`empty.applications.${role}.title`)}
            text={t(`empty.applications.${role}.text`)}
            action={
              role === "candidate"
                ? {
                    href: `/dashboard/${role}/vacancies`,
                    label: t("empty.browse"),
                  }
                : undefined
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon size={24} />}
            title={t("empty.tab.title")}
            text={t("empty.tab.text")}
          />
        ) : role === "candidate" ? (
          <table className="mt-4 w-full text-left text-sm">
            <caption className="sr-only">{t("applications.caption")}</caption>
            <thead className="sr-only md:not-sr-only">
              <tr className="text-subtle border-line border-b text-xs tracking-wide uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.vacancy")}
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.date")}
                </th>
                <th scope="col" className="py-3 font-semibold">
                  {t("applications.columns.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {candidateRows.map((a) => {
                const v = vacancyById(a.vacancyId);
                if (!v) return null;
                return (
                  <tr
                    key={a.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 md:table-row"
                  >
                    <th
                      scope="row"
                      className="w-full font-normal md:w-auto md:py-4 md:pr-4"
                    >
                      <span className="block font-bold">{v.title}</span>
                      <span className="text-subtle inline-flex items-center gap-1 text-xs">
                        {v.company} · <MapPinIcon size={12} />
                        {t(`cities.${v.city}`)}
                      </span>
                    </th>
                    <td className="text-subtle md:py-4 md:pr-4">
                      {formatDate(a.applied)}
                    </td>
                    <td className="md:py-4">
                      <StatusBadge
                        kind="candidate"
                        status={a.status}
                        label={t(`applications.candidateStatuses.${a.status}`)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <caption className="sr-only">{t("applications.caption")}</caption>
            <thead className="sr-only md:not-sr-only">
              <tr className="text-subtle border-line border-b text-xs tracking-wide uppercase">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.candidate")}
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.vacancy")}
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.match")}
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  {t("applications.columns.date")}
                </th>
                <th scope="col" className="py-3 font-semibold">
                  {t("applications.columns.status")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {employerRows.map((a) => (
                <tr
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 md:table-row"
                >
                  <th
                    scope="row"
                    className="w-full font-normal md:w-auto md:py-4 md:pr-4"
                  >
                    <span className="flex items-center gap-3">
                      <Avatar initials={a.initials} tone="violet" size="sm" />
                      <span>
                        <span className="block font-bold">{a.name}</span>
                        <span className="text-subtle block text-xs">
                          {t("experience", { years: a.experience })}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="w-full md:w-auto md:py-4 md:pr-4">
                    {vacancyById(a.vacancyId)?.title}
                  </td>
                  <td className="md:py-4 md:pr-4">
                    <MatchMeter
                      value={a.match}
                      label={t("match", { value: a.match })}
                    />
                  </td>
                  <td className="text-subtle md:py-4 md:pr-4">
                    {formatDate(a.applied)}
                  </td>
                  <td className="md:py-4">
                    <StatusBadge
                      kind="employer"
                      status={a.status}
                      label={t(`applications.employerStatuses.${a.status}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {switcher}
    </>
  );
}
