import type { CandidateStageType, Lang } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { DecisionBadge } from "@/frontend/components/match/decision-badge";
import { MatchPanel } from "@/frontend/components/match/match-panel";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { listDecided } from "@/backend/match/decision";
import { getMatchResults } from "@/backend/match/service";
import { formatDate } from "@/backend/format-date";
import {
  attachCompanyPersonality,
  parseCompanyFilters,
} from "@/backend/readiness/company";
import {
  computePersonalityMatchPct,
  getLocaleKey,
  PERSONALITY_GROUPS,
  PERSONALITY_TYPE_CATALOG,
  type PersonalityGroupCode,
} from "@/backend/personality/catalog";

const STAGE_LABELS: Record<CandidateStageType, string> = {
  NEW: "Yangi",
  REVIEWING: "Ko'rib chiqilmoqda",
  LIKED: "Yoqdi",
  INTERVIEW: "Suhbat",
  ACCEPTED: "Qabul qilindi",
  REJECTED: "Rad etildi",
};
const filterLabels = {
  jobs: "Barcha kasblar",
  groups: "Barcha guruhlar",
  types: "Barcha tiplar",
  onlyPersonalityMatch: "Faqat xarakteri mos",
  languages: "Barcha tillar",
  experience: "Barcha tajriba",
  filter: "Filtrlash",
  languageBands: [
    ["NATIVE_ONLY", "Ona tili"],
    ["ONE", "1 xorijiy til"],
    ["TWO_PLUS", "2+ xorijiy til"],
  ] as const,
  experienceBands: [
    ["NONE", "Tajribasiz"],
    ["UNDER_1", "1 yilgacha"],
    ["ONE_TO_THREE", "1–3 yil"],
    ["OVER_3", "3 yildan ko'p"],
  ] as const,
};

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    professionId?: string;
    personalityGroup?: string;
    typeCode?: string;
    language?: string;
    languageBand?: string;
    experienceBand?: string;
    onlyPersonalityMatch?: string;
  }>;
}) {
  const { company, locale } = await requireCompanyPage();
  const langKey = getLocaleKey(locale);
  const t = await getTranslations("Matches");
  const tStatus = await getTranslations("Company.status");
  const { id } = await params;
  const search = await searchParams;
  const { tab = "matches" } = search;
  const filters = parseCompanyFilters(
    new URLSearchParams(
      Object.entries(search).filter((entry): entry is [string, string] =>
        Boolean(entry[1]),
      ),
    ),
  );
  const hasProfileFilter = Boolean(
    filters.professionId ||
    filters.personalityGroup ||
    filters.typeCode ||
    filters.languageBand ||
    filters.experienceBand,
  );
  const query = new URLSearchParams(
    Object.entries(search).filter(
      (entry): entry is [string, string] =>
        Boolean(entry[1]) && entry[0] !== "tab",
    ),
  );
  const tabHref = (next: string) =>
    `/company/vacancies/${id}/matches?${new URLSearchParams([...query, ["tab", next]]).toString()}`;

  // Faqat o'z talabi: boshqa kompaniyaniki "topilmadi".
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
  });
  if (!vacancy) notFound();

  // Tasdiqlanmagan kompaniya natijalarni ko'rmaydi (API ham 403 qaytaradi).
  const access = companyAccess(company);
  const hasWantedPersonality =
    vacancy.wantedTypes.length > 0 || vacancy.wantedGroups.length > 0;
  const onlyPersonalityMatch = search.onlyPersonalityMatch === "1";
  const [initial, decided, applications, stages, professions] =
    access.canViewCvs
      ? await Promise.all([
          getMatchResults(company, vacancy, locale as Lang, filters).then(
            (outcome) =>
              attachCompanyPersonality(outcome, {
                vacancy,
                locale: langKey,
                onlyPersonalityMatch,
              }),
          ),
          listDecided(vacancy.id, !access.canRunMatching),
          db.vacancyApplication.findMany({
            where: {
              vacancyId: vacancy.id,
              ...(hasProfileFilter || filters.language
                ? {
                    cv: {
                      user: {
                        ...(hasProfileFilter
                          ? {
                              readinessProfiles: {
                                some: {
                                  ...(filters.professionId
                                    ? { professionId: filters.professionId }
                                    : {}),
                                  ...(filters.personalityGroup
                                    ? {
                                        personalityGroup:
                                          filters.personalityGroup,
                                      }
                                    : {}),
                                  ...(filters.typeCode
                                    ? { typeCode: filters.typeCode }
                                    : {}),
                                  ...(filters.languageBand
                                    ? { languageBand: filters.languageBand }
                                    : {}),
                                  ...(filters.experienceBand
                                    ? { experienceBand: filters.experienceBand }
                                    : {}),
                                },
                              },
                            }
                          : {}),
                        ...(filters.language
                          ? {
                              userLanguages: {
                                some: {
                                  language: {
                                    contains: filters.language.toLowerCase(),
                                    mode: "insensitive" as const,
                                  },
                                },
                              },
                            }
                          : {}),
                      },
                    },
                  }
                : {}),
            },
            select: {
              id: true,
              cvId: true,
              note: true,
              createdAt: true,
              cv: {
                select: {
                  id: true,
                  title: true,
                  savedAt: true,
                  user: {
                    select: {
                      personalityResults: {
                        where: { archivedAt: null, invalidatedAt: null },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { typeCode: true },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          db.candidateStage.findMany({
            where: { vacancyId: vacancy.id },
          }),
          db.profession.findMany({
            where: { parentId: { not: null }, isActive: true },
            orderBy: { nameUz: "asc" },
            select: { id: true, nameUz: true },
          }),
        ])
      : [null, [], [], [], []];

  const stageMap = new Map(stages.map((s) => [s.cvId, s.stage]));
  const personalityMatchBadge = "Xarakteri mos";
  const personalityMatchPctPrefix = "Xarakter mosligi";
  const enrichedApplications = applications
    .map((app) => {
      const code = app.cv.user.personalityResults[0]?.typeCode ?? null;
      const pMatch = hasWantedPersonality
        ? computePersonalityMatchPct(
            code,
            vacancy.wantedTypes,
            vacancy.wantedGroups,
          )
        : null;
      const typeInfo = code
        ? PERSONALITY_TYPE_CATALOG.find((item) => item.code === code)
        : null;
      return {
        ...app,
        personalityTypeName: typeInfo?.title[langKey] ?? null,
        personalityMatchPct: pMatch ? pMatch.matchPct : null,
        personalityMatchLabel: pMatch
          ? `${personalityMatchPctPrefix}: ${pMatch.matchPct}%`
          : null,
        isPersonalityMatch: Boolean(pMatch?.isExactMatch),
      };
    })
    .filter((app) => !onlyPersonalityMatch || !hasWantedPersonality || app.isPersonalityMatch)
    .sort(
      (a, b) =>
        Number(b.isPersonalityMatch) - Number(a.isPersonalityMatch) ||
        (b.personalityMatchPct ?? 0) - (a.personalityMatchPct ?? 0),
    );

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 space-y-3">
            <Link
              href="/company/vacancies"
              className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-colors"
            >
              <ArrowLeftIcon size={14} />
              {t("back")}
            </Link>
            <h1 className="text-h2 text-text font-extrabold tracking-tight break-words">
              {t("title", { title: vacancy.title })}
            </h1>
          </div>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={75}>
        <div className="border-line bg-card/70 inline-flex rounded-2xl border p-1.5 backdrop-blur-md">
          <Link
            href={tabHref("matches")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === "matches"
                ? "bg-primary text-on-primary shadow-primary"
                : "text-subtle hover:text-text"
            }`}
          >
            {t("tabs.matches")}
          </Link>
          <Link
            href={tabHref("applications")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === "applications"
                ? "bg-primary text-on-primary shadow-primary"
                : "text-subtle hover:text-text"
            }`}
          >
            {t("tabs.applications", { count: applications.length })}
          </Link>
        </div>
      </Reveal>

      {access.canViewCvs && (
        <form
          method="get"
          className="border-line bg-card grid gap-2 rounded-2xl border p-4 sm:grid-cols-3"
        >
          <input type="hidden" name="tab" value={tab} />
          <select
            name="professionId"
            defaultValue={filters.professionId ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label="Kasb"
          >
            <option value="">{filterLabels.jobs}</option>
            {professions.map((profession) => (
              <option key={profession.id} value={profession.id}>
                {profession.nameUz}
              </option>
            ))}
          </select>
          <select
            name="personalityGroup"
            defaultValue={filters.personalityGroup ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label="Xarakter guruhi"
          >
            <option value="">{filterLabels.groups}</option>
            {(["NT", "NF", "SJ", "SP"] as PersonalityGroupCode[]).map(
              (group) => (
                <option key={group} value={group}>
                  {PERSONALITY_GROUPS[group].name[langKey]}
                </option>
              ),
            )}
          </select>
          <select
            name="typeCode"
            defaultValue={filters.typeCode ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label="Xarakter tipi"
          >
            <option value="">{filterLabels.types}</option>
            {PERSONALITY_TYPE_CATALOG.map((item) => (
              <option key={item.code} value={item.code}>
                {item.title[langKey]}
              </option>
            ))}
          </select>
          {hasWantedPersonality && (
            <label className="border-line flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold">
              <input
                type="checkbox"
                name="onlyPersonalityMatch"
                value="1"
                defaultChecked={onlyPersonalityMatch}
                className="accent-primary h-4 w-4"
              />
              <span>{filterLabels.onlyPersonalityMatch}</span>
            </label>
          )}
          <input
            name="language"
            defaultValue={filters.language ?? ""}
            placeholder="Til"
            className="border-line rounded-xl border p-2"
          />
          <select
            name="languageBand"
            defaultValue={filters.languageBand ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label="Til toifasi"
          >
            <option value="">{filterLabels.languages}</option>
            {filterLabels.languageBands.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="experienceBand"
            defaultValue={filters.experienceBand ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label="Tajriba"
          >
            <option value="">{filterLabels.experience}</option>
            {filterLabels.experienceBands.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
            {filterLabels.filter}
          </button>
        </form>
      )}

      {tab === "applications" ? (
        <Reveal delay={150}>
          <section className="space-y-4">
            {enrichedApplications.length === 0 ? (
              <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-md">
                <p className="text-subtle text-sm">{t("applicationsEmpty")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {enrichedApplications.map((app) => {
                  const stage = stageMap.get(app.cvId);
                  return (
                    <li
                      key={app.id}
                      className="border-line bg-card/90 shadow-soft flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-5 backdrop-blur-md transition-all hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-text text-base font-extrabold">
                            {app.cv.title}
                          </span>
                          {app.personalityTypeName ? (
                            <span className="border-line bg-canvas text-subtle rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                              {app.personalityTypeName}
                            </span>
                          ) : null}
                          {app.isPersonalityMatch ? (
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              {personalityMatchBadge}
                            </span>
                          ) : null}
                          {app.personalityMatchLabel ? (
                            <span className="border-line bg-canvas text-text rounded-full border px-2.5 py-0.5 text-xs font-bold">
                              {app.personalityMatchLabel}
                            </span>
                          ) : null}
                          {stage ? (
                            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                              {STAGE_LABELS[stage]}
                            </span>
                          ) : null}
                        </div>
                        {app.note ? (
                          <p className="text-text/85 border-line bg-canvas/70 rounded-xl border px-3 py-2 text-xs leading-relaxed whitespace-pre-line">
                            {app.note}
                          </p>
                        ) : null}
                        <p className="text-subtle text-xs">
                          {t("appliedAt", { date: formatDate(app.createdAt) })}
                        </p>
                      </div>

                      <Link
                        href={`/company/vacancies/${vacancy.id}/candidates/${app.cvId}`}
                        className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
                      >
                        {t("viewApplication")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Reveal>
      ) : (
        <Reveal delay={150}>
          <div className="space-y-6">
            {initial ? (
              <MatchPanel
                key={query.toString()}
                vacancyId={vacancy.id}
                initial={initial}
                filters={filters}
              />
            ) : (
              <FormAlert>
                {tStatus(
                  company.approval === "REJECTED" ? "REJECTED" : "PENDING",
                )}
              </FormAlert>
            )}
            {decided.length > 0 ? (
              <section className="border-line bg-card/90 shadow-soft space-y-3 rounded-3xl border p-6 backdrop-blur-md">
                <h2 className="text-text text-lg font-extrabold">
                  {t("decided")}
                </h2>
                <ul className="space-y-2.5">
                  {decided.map((item) => (
                    <li
                      key={item.cvId}
                      className="border-line bg-canvas/70 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5 text-sm"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <DecisionBadge decision={item.decision} />
                        <span className="text-text min-w-0 break-words">
                          {[item.skills.slice(0, 5).join(", "), item.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span className="text-subtle text-xs">
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                      <Link
                        href={`/company/vacancies/${vacancy.id}/candidates/${item.cvId}`}
                        className="text-primary font-bold hover:underline"
                      >
                        {t("openCv")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </Reveal>
      )}
    </div>
  );
}
