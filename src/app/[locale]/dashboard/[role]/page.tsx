import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Avatar } from "@/components/ds/avatar";
import { Badge } from "@/components/ds/badge";
import { buttonClass } from "@/components/ds/button";
import { cn } from "@/components/ds/cn";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { parseState, StateSwitcher } from "@/components/dashboard/page-state";
import {
  EmptyState,
  MatchMeter,
  PageHeader,
  PANEL,
  ProgressBar,
  SectionTitle,
  StatCard,
  TextLink,
} from "@/components/dashboard/ui";
import {
  BookmarkIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  FileTextIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  EMPLOYER_APPLICATIONS,
  INTERVIEWS,
  isRole,
  PERSON,
  PROFILE_STEPS,
  STATS,
  VACANCIES,
  formatSom,
  vacancyById,
} from "@/lib/dashboard/mock";
import { formatDateTime } from "@/lib/format-date";

type Props = {
  params: Promise<{ locale: string; role: string }>;
  searchParams: Promise<{ state?: string }>;
};

const STAT_ICONS = {
  applications: FileTextIcon,
  interviews: CalendarIcon,
  views: UserIcon,
  saved: BookmarkIcon,
  activeVacancies: BriefcaseIcon,
  newApplications: UsersIcon,
  avgMatch: ChartIcon,
} as const;

export default async function OverviewPage({ params, searchParams }: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale) || !isRole(role)) notFound();
  setRequestLocale(locale);
  const state = parseState((await searchParams).state);
  const t = await getTranslations("Dashboard");
  const base = `/dashboard/${role}`;
  const switcher = <StateSwitcher href={base} current={state} />;

  if (state === "loading")
    return (
      <>
        <DashboardSkeleton variant="overview" label={t("loading")} />
        {switcher}
      </>
    );

  const empty = state === "empty";
  const steps = PROFILE_STEPS[role].map((s) => ({
    ...s,
    done: empty ? false : s.done,
  }));
  const progress = Math.round(
    (steps.filter((s) => s.done).length / steps.length) * 100,
  );
  const interviews = empty ? [] : INTERVIEWS[role];

  return (
    <>
      <PageHeader
        title={t("overview.greeting", { name: PERSON[role].name })}
        lead={t(`overview.lead.${role}`)}
      />

      <section aria-label={t("overview.statsLabel")}>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {STATS[role].map((s, i) => {
            const Icon = STAT_ICONS[s.key];
            const value = empty ? 0 : s.value;
            const delta = empty ? 0 : s.delta;
            return (
              <li key={s.key}>
                <StatCard
                  accent={i === 0 && !empty}
                  label={t(`overview.stats.${s.key}`)}
                  value={`${value}${s.suffix ?? ""}`}
                  delta={
                    delta
                      ? t("overview.delta", { value: delta })
                      : t("overview.deltaZero")
                  }
                  icon={<Icon size={20} />}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <section
          aria-labelledby="recommended-title"
          className={cn(PANEL, "p-5 sm:p-6 lg:col-span-2")}
        >
          <SectionTitle
            id="recommended-title"
            action={
              empty ? null : (
                <TextLink
                  href={`${base}/${role === "candidate" ? "vacancies" : "applications"}`}
                >
                  {t("overview.seeAll")}
                </TextLink>
              )
            }
          >
            {t(`overview.recommended.${role}`)}
          </SectionTitle>
          {empty ? (
            <EmptyState
              compact
              icon={<BriefcaseIcon size={24} />}
              title={t("empty.recommended")}
              action={{ href: `${base}/vacancies`, label: t("empty.browse") }}
            />
          ) : role === "candidate" ? (
            <ul className="divide-line flex flex-col divide-y">
              {[...VACANCIES]
                .sort((a, b) => b.match - a.match)
                .slice(0, 5)
                .map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <span className="bg-primary-soft text-primary-text inline-flex size-12 shrink-0 items-center justify-center rounded-full">
                      <BriefcaseIcon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{v.title}</p>
                      <p className="text-subtle mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span>{v.company}</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon size={14} />
                          {t(`cities.${v.city}`)}
                        </span>
                        <span>
                          {t("salary", {
                            from: formatSom(v.salaryFrom),
                            to: formatSom(v.salaryTo),
                          })}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MatchMeter
                        value={v.match}
                        label={t("match", { value: v.match })}
                      />
                      <Badge tone="neutral">{t(`types.${v.type}`)}</Badge>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <ul className="divide-line flex flex-col divide-y">
              {[...EMPLOYER_APPLICATIONS]
                .sort((a, b) => b.match - a.match)
                .slice(0, 5)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <Avatar initials={a.initials} tone="violet" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{a.name}</p>
                      <p className="text-subtle mt-0.5 text-sm">
                        {vacancyById(a.vacancyId)?.title} ·{" "}
                        {t("experience", { years: a.experience })}
                      </p>
                    </div>
                    <MatchMeter
                      value={a.match}
                      label={t("match", { value: a.match })}
                    />
                  </li>
                ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="interviews-title"
            className={cn(PANEL, "p-5 sm:p-6")}
          >
            <SectionTitle id="interviews-title">
              {t("overview.interviews")}
            </SectionTitle>
            {interviews.length ? (
              <ul className="flex flex-col gap-3">
                {interviews.map((i) => {
                  const [date, time] = formatDateTime(i.at).split(" ");
                  return (
                    <li
                      key={i.id}
                      className="bg-peach rounded-field flex items-center gap-3 p-3"
                    >
                      <span className="bg-card rounded-field flex w-14 shrink-0 flex-col items-center py-1.5 leading-tight">
                        <span className="text-primary-text text-sm font-extrabold">
                          {time}
                        </span>
                        <span className="text-subtle text-[0.6875rem]">
                          {date.slice(0, 5)}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {i.with ?? vacancyById(i.vacancyId)?.title}
                        </p>
                        <p className="text-subtle truncate text-xs">
                          {i.with
                            ? vacancyById(i.vacancyId)?.title
                            : vacancyById(i.vacancyId)?.company}{" "}
                          · {t(`overview.${i.format}`)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={<CalendarIcon size={24} />}
                title={t("empty.interviews")}
              />
            )}
          </section>

          <section
            aria-labelledby="progress-title"
            className={cn(PANEL, "p-5 sm:p-6")}
          >
            <SectionTitle id="progress-title">
              {t("overview.progress")}
            </SectionTitle>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[1.75rem] leading-none font-extrabold">
                {t("percent", { value: progress })}
              </p>
              <p className="text-subtle text-sm">
                {t("overview.progressValue", { value: progress })}
              </p>
            </div>
            <ProgressBar
              value={progress}
              label={t("overview.progress")}
              className="mt-3"
            />
            <ul className="mt-5 flex flex-col gap-2.5">
              {steps.map((s) => (
                <li key={s.key} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                      s.done
                        ? "bg-success-soft text-success"
                        : "border-line border border-dashed",
                    )}
                  >
                    {s.done ? <CheckIcon size={14} /> : null}
                  </span>
                  <span className={s.done ? undefined : "text-subtle"}>
                    {t(`overview.progressSteps.${s.key}`)}
                  </span>
                  <span className="sr-only">
                    {s.done ? t("overview.done") : t("overview.todo")}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href={role === "candidate" ? "/student/cv" : "/company"}
              className={buttonClass({
                variant: "dark",
                size: "sm",
                className: "mt-5 w-full",
              })}
            >
              {t("overview.progressCta")}
            </Link>
          </section>
        </div>
      </div>
      {switcher}
    </>
  );
}
