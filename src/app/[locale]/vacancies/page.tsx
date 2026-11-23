import type { Metadata } from "next";
import { Prisma, VacancyStatus, WorkType } from "@prisma/client";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import {
  CANONICAL_SITE_URL,
  OG_LOCALE,
  SEO_KEYWORDS,
  buildAlternates,
} from "@/backend/seo";
import {
  AUDIENCE_KEYS,
  type AudienceProfile,
  isValidAudienceKey,
  rankVacanciesForAudience,
} from "@/backend/vacancy/audience-match";
import { cn } from "@/frontend/components/ds/cn";
import { Reveal } from "@/frontend/components/ds/motion";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  MapPinIcon,
  SearchIcon,
  SparkIcon,
} from "@/frontend/components/icons";
import { Link, redirect } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: validLocale,
    namespace: "VacanciesList",
  });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    keywords: SEO_KEYWORDS[validLocale],
    alternates: buildAlternates(validLocale, "/vacancies"),
    openGraph: {
      type: "website",
      siteName: "Candidator",
      locale: OG_LOCALE[validLocale],
      url: `${CANONICAL_SITE_URL}/${validLocale}/vacancies`,
      title: `${title} — Candidator`,
      description,
      images: [
        {
          url: `${CANONICAL_SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Candidator",
        },
      ],
    },
  };
}

const REVEAL_DELAYS = [0, 75, 150, 225] as const;

type SortMode = "match" | "only_match" | "latest";

function parseSortMode(val?: string): SortMode {
  if (val === "only_match" || val === "latest") return val;
  return "match";
}

function buildFilterHref(
  current: {
    q?: string;
    workType?: string;
    location?: string;
    minSalary?: string;
    audience?: string;
    sort?: string;
  },
  overrides: Partial<{
    audience: string | undefined;
    sort: string | undefined;
  }>,
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.workType) params.set("workType", merged.workType);
  if (merged.location) params.set("location", merged.location);
  if (merged.minSalary) params.set("minSalary", merged.minSalary);
  if (merged.audience) params.set("audience", merged.audience);
  if (merged.sort && merged.sort !== "match") params.set("sort", merged.sort);
  const qs = params.toString();
  return qs ? `/vacancies?${qs}` : "/vacancies";
}

export default async function PublicVacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    workType?: string;
    location?: string;
    minSalary?: string;
    audience?: string;
    sort?: string;
  }>;
}) {
  const user = await currentUser();
  if (user?.role === "COMPANY") {
    const locale = await getLocale();
    return redirect({ href: "/company/students", locale });
  }

  const sp = await searchParams;
  const { q, workType, location, minSalary, audience } = sp;
  const sortMode = parseSortMode(sp.sort);
  const t = await getTranslations("VacanciesList");

  const now = new Date();
  const andConditions: Prisma.VacancyWhereInput[] = [
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  ];

  if (workType && Object.values(WorkType).includes(workType as WorkType)) {
    andConditions.push({ workType: workType as WorkType });
  }

  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { rawText: { contains: q, mode: "insensitive" } },
        { skills: { has: q } },
        { company: { name: { contains: q, mode: "insensitive" } } },
        { company: { industry: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (location) {
    andConditions.push({
      location: { contains: location, mode: "insensitive" },
    });
  }

  const parsedSalary = minSalary ? Number(minSalary) : NaN;
  if (!Number.isNaN(parsedSalary) && parsedSalary > 0) {
    andConditions.push({
      OR: [
        { salaryTo: { gte: parsedSalary } },
        { salaryFrom: { gte: parsedSalary } },
      ],
    });
  }

  const where: Prisma.VacancyWhereInput = {
    status: VacancyStatus.ACTIVE,
    company: { approval: "APPROVED", user: { status: "ACTIVE" } },
    AND: andConditions,
  };

  const [vacancies, studentCvs] = await Promise.all([
    db.vacancy.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            hasLogo: true,
            industry: true,
            approval: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    user?.role === "STUDENT"
      ? db.$queryRaw<
          Array<{
            title: string;
            skills: string[];
            searchText: string;
            location: string | null;
            workTypes: WorkType[];
            goal: string | null;
          }>
        >(Prisma.sql`
          SELECT title, skills, "searchText", location, "workTypes", data->>'goal' AS goal
          FROM "Cv"
          WHERE "userId" = ${user.id} AND "savedAt" IS NOT NULL
          ORDER BY "updatedAt" DESC
          LIMIT 10
        `)
      : Promise.resolve([]),
  ]);

  // Build audience profile from student's saved CVs or explicit audience filter pill
  const explicitAudience = isValidAudienceKey(audience) ? audience : null;
  const disableCvMatch = audience === "all";
  const hasStudentCv = studentCvs.length > 0;
  const primaryCvTitle =
    studentCvs.find((c) => c.title.trim())?.title.trim() ||
    studentCvs[0]?.goal?.trim() ||
    "CV";

  let audienceProfile: AudienceProfile | null = null;
  if (explicitAudience) {
    audienceProfile = {
      titles: [],
      skills: [],
      searchText: "",
      locations: [],
      workTypes: [],
      explicitAudience,
    };
  } else if (hasStudentCv && !disableCvMatch) {
    const titles: string[] = [];
    const skills: string[] = [];
    const searchTexts: string[] = [];
    const locations: string[] = [];
    const workTypes: string[] = [];

    for (const cv of studentCvs) {
      if (cv.title) titles.push(cv.title);
      if (cv.goal) titles.push(cv.goal);
      skills.push(...cv.skills);
      if (cv.searchText) searchTexts.push(cv.searchText);
      if (cv.location) locations.push(cv.location);
      workTypes.push(...cv.workTypes);
    }

    audienceProfile = {
      titles,
      skills,
      searchText: searchTexts.join(" "),
      locations,
      workTypes,
    };
  }

  const ranked = rankVacanciesForAudience(vacancies, audienceProfile, sortMode);
  const matchedItems = ranked.filter((r) => r.isAudienceMatch);
  const otherItems = ranked.filter((r) => !r.isAudienceMatch);
  const showSplitSections =
    sortMode === "match" &&
    Boolean(audienceProfile) &&
    matchedItems.length > 0 &&
    otherItems.length > 0;

  function renderVacancyCard(
    item: (typeof ranked)[number],
    idx: number,
  ) {
    const { vacancy, isAudienceMatch, matchScore } = item;
    const salaryLabel =
      vacancy.salaryFrom || vacancy.salaryTo
        ? [
            vacancy.salaryFrom ? vacancy.salaryFrom.toLocaleString() : "",
            vacancy.salaryTo ? `– ${vacancy.salaryTo.toLocaleString()}` : "",
            vacancy.currency,
          ]
            .filter(Boolean)
            .join(" ")
        : null;
    const companyDisplay =
      vacancy.company.name?.trim() ||
      vacancy.company.industry?.trim() ||
      "CANDIDATOR";
    const industryLabel =
      vacancy.company.industry &&
      vacancy.company.name &&
      vacancy.company.industry.trim() !== vacancy.company.name.trim()
        ? `· ${vacancy.company.industry}`
        : null;
    const companyInitial = (companyDisplay[0] ?? "C").toUpperCase();

    return (
      <Reveal key={vacancy.id} delay={REVEAL_DELAYS[idx % 4]}>
        <Link
          href={`/vacancies/${vacancy.id}`}
          className={cn(
            "bg-card shadow-soft hover:shadow-float group relative block overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1",
            isAudienceMatch && sortMode !== "latest"
              ? "border-emerald-500/55 ring-1 ring-emerald-500/20"
              : "border-line hover:border-primary/45",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              {vacancy.company.hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/companies/${vacancy.company.id}/logo`}
                  alt={companyDisplay}
                  className="size-12 shrink-0 rounded-2xl bg-white object-contain p-1 ring-1 ring-black/5"
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-base font-black text-white shadow-sm"
                >
                  {companyInitial}
                </span>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-subtle text-xs font-extrabold tracking-wider uppercase">
                    {companyDisplay}
                  </span>
                  {industryLabel ? (
                    <span className="text-subtle text-xs font-medium">
                      {industryLabel}
                    </span>
                  ) : null}
                  {isAudienceMatch && sortMode !== "latest" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                      <CheckIcon size={12} />
                      {t("matchBadge", { score: matchScore })}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-text group-hover:text-primary-text text-lg font-black transition-colors sm:text-xl">
                  {vacancy.title}
                </h2>
              </div>
            </div>

            {/* Salary */}
            <div className="flex items-center gap-3">
              {salaryLabel ? (
                <span className="bg-primary-soft text-primary-text rounded-xl px-3.5 py-1.5 text-sm font-black tabular-nums">
                  {salaryLabel}
                </span>
              ) : (
                <span className="text-subtle text-xs font-bold">
                  {t("salaryNegotiable")}
                </span>
              )}
              <span className="border-line bg-card-cool text-subtle group-hover:bg-primary group-hover:text-on-primary hidden size-9 items-center justify-center rounded-full border transition-colors sm:inline-flex">
                <ArrowRightIcon size={16} />
              </span>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {vacancy.workType ? (
              <span className="bg-primary-soft text-primary-text rounded-xl px-3 py-1 font-bold">
                {t(`workTypes.${vacancy.workType}` as "workTypes.FULL_TIME")}
              </span>
            ) : null}
            {vacancy.location ? (
              <span className="border-line bg-card-cool text-text rounded-xl border px-3 py-1 font-medium">
                {t("location", { location: vacancy.location })}
              </span>
            ) : null}
            {vacancy.minExperienceYears !== null ? (
              <span className="border-line bg-card-cool text-text rounded-xl border px-3 py-1 font-medium">
                {vacancy.minExperienceYears > 0
                  ? t("experience", {
                      years: vacancy.minExperienceYears,
                    })
                  : t("noExperience")}
              </span>
            ) : null}
            <span className="text-subtle ml-auto font-medium">
              {formatDate(vacancy.createdAt)}
            </span>
          </div>

          {/* Skills */}
          {vacancy.skills.length > 0 ? (
            <div className="border-line/70 mt-4 flex flex-wrap gap-1.5 border-t pt-3">
              {vacancy.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="border-line bg-card-cool text-text rounded-lg border px-2.5 py-1 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
              {vacancy.skills.length > 6 ? (
                <span className="text-subtle self-center px-1 text-xs font-semibold">
                  {t("moreSkills", {
                    count: vacancy.skills.length - 6,
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
        </Link>
      </Reveal>
    );
  }

  return (
    <div className="page-x font-ui space-y-8 py-8 sm:py-12">
      {/* Page Header, Search Form & Audience-Matching Filter Bar */}
      <Reveal>
        <div className="border-line bg-card shadow-float relative overflow-hidden rounded-3xl border p-6 sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-h2 text-text font-black tracking-tight">
                {t("title")}
              </h1>
              <p className="text-subtle max-w-2xl text-sm sm:text-base">
                {t("description")}
              </p>
            </div>

            {/* Sort Order Switcher (Matched First vs Only Matched vs Latest) */}
            <div className="border-line bg-card-cool inline-flex flex-wrap items-center gap-1 rounded-2xl border p-1">
              <span className="text-subtle px-2.5 text-xs font-bold">
                {t("sortLabel")}
              </span>
              {(
                [
                  ["match", t("sortMatchFirst")],
                  ["only_match", t("sortOnlyMatch")],
                  ["latest", t("sortLatest")],
                ] as const
              ).map(([key, label]) => {
                const active = sortMode === key;
                return (
                  <Link
                    key={key}
                    href={buildFilterHref(sp, { sort: key })}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all",
                      active
                        ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs"
                        : "text-subtle hover:text-text",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <form
            method="GET"
            className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
          >
            {audience ? (
              <input type="hidden" name="audience" value={audience} />
            ) : null}
            {sortMode !== "match" ? (
              <input type="hidden" name="sort" value={sortMode} />
            ) : null}

            <div className="relative">
              <SearchIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder={t("searchPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-colors"
              />
            </div>

            <div className="relative">
              <MapPinIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="text"
                name="location"
                defaultValue={location ?? ""}
                placeholder={t("locationPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-colors"
              />
            </div>

            <input
              type="number"
              name="minSalary"
              min={0}
              step={500000}
              defaultValue={minSalary ?? ""}
              placeholder={t("minSalaryPlaceholder")}
              className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-colors"
            />

            <select
              name="workType"
              defaultValue={workType ?? ""}
              className="border-line bg-canvas text-text focus:border-primary w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-colors"
            >
              <option value="">{t("allWorkTypes")}</option>
              <option value="FULL_TIME">{t("workTypes.FULL_TIME")}</option>
              <option value="PART_TIME">{t("workTypes.PART_TIME")}</option>
              <option value="REMOTE">{t("workTypes.REMOTE")}</option>
              <option value="INTERNSHIP">{t("workTypes.INTERNSHIP")}</option>
            </select>

            <button
              type="submit"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <SearchIcon size={16} />
              {t("search")}
            </button>
          </form>

          {/* Audience / Profession Filter Pills (Dispatcher, Education, Finance, Sales, Med, IT, Eng) */}
          <div className="border-line/70 relative z-10 mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="text-subtle mr-1 inline-flex items-center gap-1.5 text-xs font-extrabold">
              <SparkIcon size={14} className="text-primary-text" />
              {t("audienceLabel")}
            </span>

            {hasStudentCv ? (
              <Link
                href={buildFilterHref(sp, {
                  audience: undefined,
                  sort: sortMode === "latest" ? "match" : sortMode,
                })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-all",
                  !explicitAudience && !disableCvMatch
                    ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs"
                    : "border-line bg-card-cool text-text hover:border-primary",
                )}
              >
                <SparkIcon size={12} />
                <span>{t("audienceMyCv", { role: primaryCvTitle })}</span>
              </Link>
            ) : null}

            <Link
              href={buildFilterHref(sp, {
                audience: hasStudentCv ? "all" : undefined,
              })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                (!hasStudentCv && !explicitAudience) || disableCvMatch
                  ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs"
                  : "border-line bg-card-cool text-subtle hover:border-primary hover:text-text",
              )}
            >
              {t("audienceAll")}
            </Link>

            {AUDIENCE_KEYS.map((key) => {
              const active = explicitAudience === key;
              return (
                <Link
                  key={key}
                  href={buildFilterHref(sp, {
                    audience: active ? (hasStudentCv ? "all" : undefined) : key,
                    sort: sortMode === "latest" ? "match" : sortMode,
                  })}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
                    active
                      ? "border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xs"
                      : "border-line bg-card-cool text-text hover:border-primary hover:text-primary-text",
                  )}
                >
                  {t(`audiences.${key}` as "audiences.dispatch")}
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Vacancies List: Audience-Matched First, Remaining Below ("qalgani izine tusedi") */}
      {ranked.length === 0 ? (
        <Reveal>
          <div className="border-line bg-card shadow-soft rounded-3xl border p-12 text-center">
            <BriefcaseIcon size={32} className="text-subtle mx-auto mb-3" />
            <p className="text-subtle text-base font-medium">{t("empty")}</p>
          </div>
        </Reveal>
      ) : showSplitSections ? (
        <div className="space-y-8">
          {/* 1. First Row: Vacancies Matching the User's CV / Audience */}
          <section className="space-y-4">
            <div className="border-primary/35 bg-primary-soft/60 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xs">
                  <SparkIcon size={18} />
                </span>
                <div>
                  <h2 className="text-text text-sm font-black sm:text-base">
                    {t("matchedSectionTitle", { count: matchedItems.length })}
                  </h2>
                  <p className="text-subtle text-xs">
                    {t("matchedSectionDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {matchedItems.map((item, idx) => renderVacancyCard(item, idx))}
            </div>
          </section>

          {/* 2. Below ("qalgani izine tusedi"): All Remaining Open Vacancies */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <h2 className="text-subtle text-sm font-extrabold tracking-wide uppercase">
                {t("otherSectionTitle", { count: otherItems.length })}
              </h2>
              <div className="bg-line h-px flex-1" />
            </div>

            <div className="grid gap-4">
              {otherItems.map((item, idx) => renderVacancyCard(item, idx))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4">
          {ranked.map((item, idx) => renderVacancyCard(item, idx))}
        </div>
      )}
    </div>
  );
}
