import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCompanyPage } from "@/backend/company/page";
import { parsePrivacy, sanitizeCvData } from "@/backend/cv/privacy";
import { evaluateCvQuality } from "@/backend/cv/quality";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { personalityGroup } from "@/backend/personality/score";
import { formatDate } from "@/backend/format-date";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import { CompanySubscribeButton } from "@/frontend/components/company/company-subscription-plans";
import { StudentsSubscriptionBar } from "@/frontend/components/company/students-subscription-bar";
import { Reveal } from "@/frontend/components/ds/motion";
import {
  PlusIcon,
  SearchIcon,
  SparkIcon,
  UsersIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CompanyStudents");
  return { title: t("title") };
}

const REVEAL_DELAYS = [0, 75, 150, 225] as const;
const readinessLabels = {
  jobs: "Barcha kasblar",
  groups: "Barcha guruhlar",
  languages: "Barcha til darajalari",
  experience: "Barcha tajriba",
  filter: "Filtrlash",
  languageBands: [
    ["NATIVE_ONLY", "0"],
    ["ONE", "1"],
    ["TWO_PLUS", "2+"],
  ] as const,
  experienceBands: [
    ["NONE", "0"],
    ["UNDER_1", "<1"],
    ["ONE_TO_THREE", "1–3"],
    ["OVER_3", "3+"],
  ] as const,
};
const personalitySummary = (item: {
  typeCode: string;
  identity: string;
  mindPct: number;
  energyPct: number;
  naturePct: number;
  tacticsPct: number;
  identityPct: number;
}) =>
  `${personalityGroup(item.typeCode)} · ${item.typeCode}-${item.identity} · M ${item.mindPct}% · E ${item.energyPct}% · N ${item.naturePct}% · T ${item.tacticsPct}% · I ${item.identityPct}%`;

export default async function CompanyStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tier?: string;
    professionId?: string;
    personalityGroup?: string;
    typeCode?: string;
    language?: string;
    languageBand?: string;
    experienceBand?: string;
  }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company");
  const tStudents = await getTranslations("CompanyStudents");
  const tWork = await getTranslations("StudentCv.workTypes");
  const {
    q,
    tier = "all",
    professionId,
    personalityGroup,
    typeCode,
    language,
    languageBand,
    experienceBand,
  } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";
  const readinessCriteria: Prisma.ReadinessProfileWhereInput = {
    ...(professionId ? { professionId } : {}),
    ...(personalityGroup ? { personalityGroup } : {}),
    ...(typeCode ? { typeCode } : {}),
    ...(languageBand ? { languageBand } : {}),
    ...(experienceBand ? { experienceBand } : {}),
  };
  const hasReadinessFilter = Boolean(
    professionId ||
    personalityGroup ||
    typeCode ||
    languageBand ||
    experienceBand,
  );

  if (company.approval !== "APPROVED") {
    return (
      <div className="page-x font-ui max-w-3xl space-y-6 py-8 sm:py-12">
        <div className="border-line bg-card/85 shadow-float flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-6 backdrop-blur-xl">
          <h1 className="text-h2 text-text font-extrabold tracking-tight">
            {tStudents("title")}
          </h1>
          <Link
            href="/company"
            className="border-line bg-canvas text-text hover:border-primary rounded-2xl border px-4 py-2 text-xs font-bold transition-colors"
          >
            {t("title")}
          </Link>
        </div>
        <div className="border-primary/30 bg-primary-soft/80 text-text rounded-3xl border p-6 text-sm font-medium backdrop-blur-md">
          {t(`status.${company.approval}`)}
        </div>
      </div>
    );
  }

  const now = new Date();
  const [cvs, hasActiveAbuna, professions] = await Promise.all([
    db.cv.findMany({
      where: {
        isVisible: true,
        savedAt: { not: null },
        user: {
          status: "ACTIVE",
          ...(hasReadinessFilter
            ? { readinessProfiles: { some: readinessCriteria } }
            : {}),
          ...(language
            ? {
                userLanguages: {
                  some: {
                    language: {
                      contains: language.toLowerCase(),
                      mode: "insensitive",
                    },
                  },
                },
              }
            : {}),
        },
        ...(query
          ? {
              OR: [
                { searchText: { contains: query, mode: "insensitive" } },
                { title: { contains: query, mode: "insensitive" } },
                {
                  AND: [
                    {
                      NOT: {
                        privacy: { path: ["hideAddress"], equals: true },
                      },
                    },
                    { location: { contains: query, mode: "insensitive" } },
                  ],
                },
              ],
            }
          : {}),
      },
      orderBy: { savedAt: "desc" },
      take: query ? 80 : 60,
      select: {
        id: true,
        userId: true,
        title: true,
        location: true,
        workTypes: true,
        skills: true,
        languages: true,
        savedAt: true,
        data: true,
        privacy: true,
        user: {
          select: {
            personalityResults: {
              where: { archivedAt: null, invalidatedAt: null },
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                typeCode: true,
                identity: true,
                mindPct: true,
                energyPct: true,
                naturePct: true,
                tacticsPct: true,
                identityPct: true,
              },
            },
          },
        },
      },
    }),
    isCompanySubscribedOrUnlocked(company.id),
    db.profession.findMany({
      where: { parentId: { not: null }, isActive: true },
      orderBy: { nameUz: "asc" },
      select: {
        id: true,
        nameKk: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
      },
    }),
  ]);
  const locale = await getLocale();
  const profName = (p: {
    nameKk: string;
    nameUz: string;
    nameRu: string;
    nameEn: string;
  }) =>
    locale === "kk"
      ? p.nameKk
      : locale === "ru"
        ? p.nameRu
        : locale === "en"
          ? p.nameEn
          : p.nameUz;

  const cvIds = cvs.map((c) => c.id);
  const companyMatches =
    cvIds.length > 0
      ? await db.match.findMany({
          where: {
            vacancy: { companyId: company.id },
            cvId: { in: cvIds },
          },
          select: { cvId: true, score: true, reason: true },
          orderBy: { score: "desc" },
        })
      : [];

  const bestMatchByCv = new Map<string, { score: number; reason: string }>();
  for (const m of companyMatches) {
    if (!bestMatchByCv.has(m.cvId)) {
      bestMatchByCv.set(m.cvId, { score: m.score, reason: m.reason });
    }
  }

  const evaluatedItems = cvs
    .map((cv) => {
      const parsed = cvDataSchema.safeParse(cv.data);
      const matchInfo = bestMatchByCv.get(cv.id);
      const quality = parsed.success
        ? evaluateCvQuality(parsed.data, {
            title: cv.title,
            aiMatchScore: matchInfo?.score ?? null,
            aiReason: matchInfo?.reason ?? null,
          })
        : {
            score: 40,
            isMukammal: false,
            tier: "BOSHLANGICH" as const,
            aiSummary: "AI tahlili: Boshlang'ich CV",
          };

      // Variant 1: Obunasiz barcha CV larning kontaktlari, F.I.Sh va PDF i qulflangan (teaser ko'rinadi).
      const isLocked = !hasActiveAbuna;
      const safe = parsed.success
        ? sanitizeCvData(parsed.data, {
            privacy: parsePrivacy(cv.privacy),
            isLocked,
          })
        : null;

      return {
        id: cv.id,
        title: cv.title,
        fullName: safe?.fullName || cv.title || tStudents("title"),
        about: safe?.goal || "",
        location:
          safe?.location ??
          (parsePrivacy(cv.privacy).hideAddress
            ? "Yashirin hudud"
            : cv.location),
        workType: cv.workTypes[0] ?? null,
        skills: cv.skills,
        languages: cv.languages,
        savedAt: cv.savedAt,
        isLocked,
        score: quality.score,
        isMukammal: quality.isMukammal,
        aiSummary: quality.aiSummary,
        personality: cv.user.personalityResults[0] ?? null,
      };
    })
    .sort((a, b) => b.score - a.score);

  const mukammalCount = evaluatedItems.filter((i) => i.isMukammal).length;
  const openCount = evaluatedItems.filter((i) => !i.isMukammal).length;

  const items = evaluatedItems.filter((item) => {
    if (tier === "mukammal") return item.isMukammal;
    if (tier === "open") return !item.isMukammal;
    return true;
  });

  const subUntilLabel =
    company.subscriptionUntil && company.subscriptionUntil > now
      ? formatDate(company.subscriptionUntil)
      : null;

  const tabAllLabel = `Barchasi (${evaluatedItems.length})`;
  const tabMukammalLabel = `🌟 Mukammal CV lar 80–100% (${mukammalCount})`;
  const tabStandardLabel = `📄 Standart CV lar <80% (${openCount})`;
  const openDetailsLabel = "Profilni ko'rish";
  const unlockBtnLabel = "🔓 Obuna olish";
  const activeFilters = new URLSearchParams();
  for (const [key, value] of Object.entries({
    q,
    professionId,
    personalityGroup,
    typeCode,
    language,
    languageBand,
    experienceBand,
  })) {
    if (value) activeFilters.set(key, value);
  }
  const tabHref = (nextTier: string) => {
    const next = new URLSearchParams(activeFilters);
    if (nextTier !== "all") next.set("tier", nextTier);
    return `/company/students${next.size ? `?${next.toString()}` : ""}`;
  };

  return (
    <div className="page-x font-ui space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-h2 text-text font-extrabold tracking-tight">
                {tStudents("title")}
              </h1>
              <p className="text-subtle mt-1 text-sm">
                {tStudents("subtitle", { count: items.length })}
              </p>
            </div>
            <Link
              href="/company/vacancies/new"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
            >
              <PlusIcon size={15} />
              {tStudents("newVacancy")}
            </Link>
          </div>

          <form method="get" className="relative z-10 mt-6 flex gap-2.5">
            {tier !== "all" ? (
              <input type="hidden" name="tier" value={tier} />
            ) : null}
            <div className="relative flex-1">
              <SearchIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder={tStudents("searchPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm transition-colors outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <SearchIcon size={15} />
              {tStudents("searchButton")}
            </button>
          </form>

          <form
            method="get"
            className="relative z-10 mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6"
          >
            {q && <input type="hidden" name="q" value={q} />}
            <select
              name="professionId"
              defaultValue={professionId ?? ""}
              className="border-line rounded-xl border p-2 text-xs"
              aria-label="Kasb"
            >
              <option value="">{readinessLabels.jobs}</option>
              {professions.map((profession) => (
                <option key={profession.id} value={profession.id}>
                  {profName(profession)}
                </option>
              ))}
            </select>
            <select
              name="personalityGroup"
              defaultValue={personalityGroup ?? ""}
              className="border-line rounded-xl border p-2 text-xs"
              aria-label="Guruh"
            >
              <option value="">{readinessLabels.groups}</option>
              {["NT", "NF", "SJ", "SP"].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <input
              name="typeCode"
              defaultValue={typeCode ?? ""}
              placeholder="Tip"
              className="border-line rounded-xl border p-2 text-xs"
            />
            <input
              name="language"
              defaultValue={language ?? ""}
              placeholder="Til"
              className="border-line rounded-xl border p-2 text-xs"
            />
            <select
              name="languageBand"
              defaultValue={languageBand ?? ""}
              className="border-line rounded-xl border p-2 text-xs"
              aria-label="Til darajasi"
            >
              <option value="">{readinessLabels.languages}</option>
              {readinessLabels.languageBands.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="experienceBand"
              defaultValue={experienceBand ?? ""}
              className="border-line rounded-xl border p-2 text-xs"
              aria-label="Tajriba"
            >
              <option value="">{readinessLabels.experience}</option>
              {readinessLabels.experienceBands.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button className="bg-primary text-on-primary rounded-xl px-3 py-2 text-xs">
              {readinessLabels.filter}
            </button>
          </form>

          {/* Filter Tabs: All / Mukammal (80-100%) / Standard (<80%) */}
          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <Link
              href={tabHref("all")}
              className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                tier === "all"
                  ? "bg-primary text-on-primary shadow-primary"
                  : "border-line bg-canvas text-text hover:border-primary border"
              }`}
            >
              {tabAllLabel}
            </Link>
            <Link
              href={tabHref("mukammal")}
              className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                tier === "mukammal"
                  ? "bg-primary text-on-primary shadow-primary"
                  : "border-line bg-canvas text-text hover:border-primary border"
              }`}
            >
              {tabMukammalLabel}
            </Link>
            <Link
              href={tabHref("open")}
              className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                tier === "open"
                  ? "bg-primary text-on-primary shadow-primary"
                  : "border-line bg-canvas text-text hover:border-primary border"
              }`}
            >
              {tabStandardLabel}
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal delay={75}>
        <StudentsSubscriptionBar
          hasActiveAbuna={hasActiveAbuna}
          subscriptionUntilLabel={subUntilLabel}
          mukammalCount={mukammalCount}
          openCount={openCount}
        />
      </Reveal>

      {items.length === 0 ? (
        <Reveal>
          <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-md">
            <UsersIcon size={30} className="text-subtle mx-auto mb-3" />
            <p className="text-subtle text-sm font-medium">
              {tStudents("empty")}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item, idx) => {
            const extraSkillsLabel =
              item.skills.length > 6 ? `+${item.skills.length - 6}` : null;
            const aiBadgeLabel = item.isMukammal
              ? `🌟 Mukammal CV (${item.score}%)`
              : `📄 AI bahosi: ${item.score}%`;
            const lockStatusText = item.isLocked
              ? "🔒 Kontakt va PDF obuna bilan"
              : "🔓 Obuna bilan ochiq";
            return (
              <li key={item.id}>
                <Reveal delay={REVEAL_DELAYS[idx % 4]} className="h-full">
                  <div
                    className={`bg-card/90 shadow-soft hover:shadow-float flex h-full flex-col justify-between gap-4 rounded-3xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${
                      item.isMukammal
                        ? "border-primary/45 hover:border-primary"
                        : "border-line hover:border-primary/40"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                            item.isMukammal
                              ? "bg-primary text-on-primary shadow-primary"
                              : "border-line bg-canvas text-text border"
                          }`}
                        >
                          <SparkIcon size={12} />
                          {aiBadgeLabel}
                        </span>
                        {item.savedAt ? (
                          <span className="text-subtle shrink-0 text-xs font-medium">
                            {formatDate(item.savedAt)}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h2 className="text-text text-base font-extrabold">
                          {item.fullName}
                        </h2>
                        {item.title ? (
                          <p className="text-primary-text mt-0.5 text-xs font-bold">
                            {item.title}
                          </p>
                        ) : null}
                      </div>

                      {item.personality && (
                        <div className="border-line rounded-xl border p-2 text-xs">
                          {personalitySummary(item.personality)}
                        </div>
                      )}

                      <div className="border-primary/20 bg-primary-soft/45 text-text rounded-2xl border px-3 py-2 text-xs leading-relaxed">
                        {item.aiSummary}
                      </div>

                      {item.about ? (
                        <p className="text-subtle line-clamp-2 text-xs leading-relaxed">
                          {item.about}
                        </p>
                      ) : null}

                      <div className="text-subtle flex flex-wrap gap-2 text-xs font-medium">
                        {item.location ? <span>{item.location}</span> : null}
                        {item.workType ? (
                          <span>{tWork(item.workType)}</span>
                        ) : null}
                        {item.languages.length > 0 ? (
                          <span>{item.languages.join(", ")}</span>
                        ) : null}
                      </div>

                      {item.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.skills.slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="border-line bg-card-cool text-text rounded-lg border px-2 py-0.5 text-[11px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                          {extraSkillsLabel ? (
                            <span className="text-subtle self-center text-[11px] font-semibold">
                              {extraSkillsLabel}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="border-line/70 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                      <span
                        className={
                          item.isLocked
                            ? "text-warning font-extrabold"
                            : "text-success font-extrabold"
                        }
                      >
                        {lockStatusText}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/company/students/${item.id}`}
                          className="border-line bg-canvas text-text hover:border-primary rounded-xl border px-3 py-1.5 font-bold transition-colors"
                        >
                          {openDetailsLabel}
                        </Link>
                        {item.isLocked ? (
                          <CompanySubscribeButton
                            variant="compact"
                            label={unlockBtnLabel}
                            cvId={item.id}
                          />
                        ) : (
                          <a
                            href={`/api/cv/${item.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-primary-soft text-primary-text hover:bg-primary hover:text-on-primary rounded-xl px-3.5 py-1.5 font-bold transition-colors"
                          >
                            {tStudents("viewPdf")}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
