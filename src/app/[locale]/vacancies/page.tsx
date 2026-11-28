import type { Metadata } from "next";
import { Prisma, VacancyStatus, type WorkType } from "@prisma/client";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { FREE_ACCESS_MODE } from "@/backend/payment/free-mode";
import { getApplyPassStatus } from "@/backend/payment/service";
import {
  CANONICAL_SITE_URL,
  OG_LOCALE,
  SEO_KEYWORDS,
  buildAlternates,
} from "@/backend/seo";
import {
  type AudienceProfile,
  isValidAudienceKey,
  rankVacanciesForAudience,
} from "@/backend/vacancy/audience-match";
import { listSavedVacancyIds } from "@/backend/vacancy/bookmarks";
import {
  type ExplorerVacancyItem,
  VacanciesExplorer,
} from "@/frontend/components/vacancy/vacancies-explorer";
import { ClientMessages } from "@/i18n/client-messages";
import { redirect } from "@/i18n/navigation";
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

function normalizeRegionKey(location: string | null | undefined): string {
  if (!location || !location.trim()) return "";
  const s = location.toLowerCase();
  if (/toshkent|tashkent|ташкент/.test(s)) return "Toshkent";
  if (/nukus|nókis|нукус|qaraqalpaq|qoraqalpog/.test(s)) return "Nukus";
  if (/samarqand|samarkand|самарканд/.test(s)) return "Samarqand";
  if (/buxoro|bukhara|бухара/.test(s)) return "Buxoro";
  if (/andijon|andijan|андижан/.test(s)) return "Andijon";
  if (/farg|fergana|фергана/.test(s)) return "Fargʻona";
  if (/namangan|наманган/.test(s)) return "Namangan";
  if (/xorazm|urganch|хорезм|ургенч/.test(s)) return "Xorazm";
  if (/qashqadaryo|qarshi|карши/.test(s)) return "Qashqadaryo";
  if (/surxondaryo|termiz|термез/.test(s)) return "Surxondaryo";
  if (/navoiy|навои/.test(s)) return "Navoiy";
  if (/jizzax|джизак/.test(s)) return "Jizzax";
  if (/sirdaryo|guliston|гулистан/.test(s)) return "Sirdaryo";
  const firstPart = location.split(/[,(/]/)[0]?.trim() ?? "";
  return firstPart.slice(0, 32);
}

export default async function PublicVacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    workType?: string;
    location?: string;
    audience?: string;
    sort?: string;
    saved?: string;
  }>;
}) {
  const user = await currentUser();
  if (user?.role === "COMPANY") {
    const locale = await getLocale();
    return redirect({ href: "/company/students", locale });
  }

  const sp = await searchParams;
  const now = new Date();

  const [
    vacancies,
    savedIds,
    studentCvs,
    appliedRows,
    passStatus,
  ] = await Promise.all([
    db.vacancy.findMany({
      where: {
        status: VacancyStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        company: { approval: "APPROVED", user: { status: "ACTIVE" } },
      },
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
      take: 120,
    }),
    user ? listSavedVacancyIds(user.id) : Promise.resolve<string[]>([]),
    user?.role === "STUDENT"
      ? db.$queryRaw<
          Array<{
            id: string;
            title: string;
            isPaid: boolean;
            skills: string[];
            searchText: string;
            location: string | null;
            workTypes: WorkType[];
            goal: string | null;
          }>
        >(Prisma.sql`
          SELECT id, title, "isPaid", skills, "searchText", location, "workTypes", data->>'goal' AS goal
          FROM "Cv"
          WHERE "userId" = ${user.id} AND "savedAt" IS NOT NULL
          ORDER BY "updatedAt" DESC
          LIMIT 15
        `)
      : Promise.resolve([]),
    user?.role === "STUDENT"
      ? db.vacancyApplication.findMany({
          where: { studentId: user.id },
          select: { vacancyId: true },
        })
      : Promise.resolve([]),
    user?.role === "STUDENT"
      ? getApplyPassStatus(user.id)
      : Promise.resolve({
          canApply: false,
          hasActivePass: false,
          freeTrialAvailable: false,
          applyPassUntil: null,
        }),
  ]);

  const explicitAudience = isValidAudienceKey(sp.audience) ? sp.audience : null;
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
  } else if (studentCvs.length > 0) {
    audienceProfile = {
      titles: studentCvs.flatMap((c) => [c.title, c.goal ?? ""].filter(Boolean)),
      skills: studentCvs.flatMap((c) => c.skills),
      searchText: studentCvs.map((c) => c.searchText).join(" "),
      locations: studentCvs.map((c) => c.location ?? "").filter(Boolean),
      workTypes: studentCvs.flatMap((c) => c.workTypes),
    };
  }

  const ranked = rankVacanciesForAudience(vacancies, audienceProfile, "match");

  const items: ExplorerVacancyItem[] = ranked.map(
    ({ vacancy, matchScore, isAudienceMatch }) => ({
      id: vacancy.id,
      title: vacancy.title,
      companyId: vacancy.company.id,
      companyName:
        vacancy.company.name?.trim() ||
        vacancy.company.industry?.trim() ||
        "Candidator",
      companyHasLogo: vacancy.company.hasLogo,
      location: vacancy.location,
      regionKey: normalizeRegionKey(vacancy.location),
      workType: vacancy.workType,
      salaryFrom: vacancy.salaryFrom,
      salaryTo: vacancy.salaryTo,
      currency: vacancy.currency,
      rawText: vacancy.rawText,
      skills: vacancy.skills,
      createdAtMs: vacancy.createdAt.getTime(),
      createdDateLabel: formatDate(vacancy.createdAt),
      expiresDateLabel: vacancy.expiresAt
        ? formatDate(vacancy.expiresAt)
        : null,
      matchScore,
      isAudienceMatch,
    }),
  );

  return (
    <ClientMessages namespaces={["VacanciesExplorer"]}>
      <VacanciesExplorer
        vacancies={items}
        initialSavedIds={savedIds}
        initialQuery={sp.q?.trim() ?? ""}
        initialRegion={sp.location ? normalizeRegionKey(sp.location) : ""}
        initialWorkType={sp.workType?.trim() ?? ""}
        initialSort={sp.sort?.trim() ?? "match"}
        initialOnlySaved={Boolean(user && sp.saved === "1")}
        applyContext={{
          isAuthenticated: Boolean(user),
          isStudent: user?.role === "STUDENT",
          canApply: passStatus.canApply,
          studentCvs: studentCvs.map((c) => ({
            id: c.id,
            title: c.title || "CV",
            isPaid: FREE_ACCESS_MODE ? true : c.isPaid,
          })),
          appliedVacancyIds: appliedRows.map((r) => r.vacancyId),
        }}
      />
    </ClientMessages>
  );
}
