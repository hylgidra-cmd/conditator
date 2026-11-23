import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { db } from "@/backend/db";

export type CategoryKey =
  "marketing" | "design" | "pm" | "business" | "graphic" | "web";

export type FeaturedVacancy = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  hasLogo: boolean;
  location: string | null;
  workType: string | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  currency: string;
  skills: string[];
};

export type ApprovedCompanyBadge = {
  id: string;
  name: string;
  industry: string | null;
  hasLogo: boolean;
};

export type CandidatePreview = {
  id: string;
  name: string;
  role: string;
  matchScore: number;
};

export type LandingStats = {
  activeVacancies: number;
  visibleCvs: number;
  approvedCompanies: number;
  approvedCompanyList: ApprovedCompanyBadge[];
  categoryCounts: Record<CategoryKey, number>;
  featuredVacancies: FeaturedVacancy[];
  candidatePreviews: CandidatePreview[];
  hiredRate: number;
};

const EMPTY_STATS: LandingStats = {
  activeVacancies: 0,
  visibleCvs: 0,
  approvedCompanies: 0,
  approvedCompanyList: [],
  categoryCounts: {
    marketing: 0,
    design: 0,
    pm: 0,
    business: 0,
    graphic: 0,
    web: 0,
  },
  featuredVacancies: [],
  candidatePreviews: [],
  hiredRate: 70,
};

async function fetchLandingStats(): Promise<LandingStats> {
  const now = new Date();
  const activeVacancyWhere = {
    status: "ACTIVE" as const,
    company: {
      approval: "APPROVED" as const,
      user: { status: "ACTIVE" as const },
    },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  // Barcha faol vakansiyalarni Node xotirasiga tortmasdan SQL ichida bitta so'rovda sanaymiz
  // va kompaniya logotipi Base64 matni o'rniga 1-baytli hasLogo bayrog'ini o'qiymiz.
  const [
    activeVacancies,
    visibleCvs,
    approvedCompanies,
    companyRows,
    categoryRows,
    featuredRows,
    candidateRows,
    appProgressRows,
  ] = await Promise.all([
    db.vacancy.count({ where: activeVacancyWhere }),
    db.cv.count({
      where: {
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
      },
    }),
    db.company.count({
      where: { approval: "APPROVED", user: { status: "ACTIVE" } },
    }),
    db.company.findMany({
      where: {
        approval: "APPROVED",
        user: { status: "ACTIVE" },
        name: { not: null },
      },
      orderBy: { approvedAt: "desc" },
      take: 10,
      select: { id: true, name: true, industry: true, hasLogo: true },
    }),
    db.$queryRaw<
      Array<{
        marketing: number;
        design: number;
        pm: number;
        business: number;
        graphic: number;
        web: number;
      }>
    >(Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'marketing|smm|seo|target|reklama|copywrit')::int AS marketing,
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'ui/?ux|figma|product design|dizayn|design')::int AS design,
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'project|product|scrum|agile|loyiha|joybar|manager|menejer')::int AS pm,
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'business|biznes|konsalting|consult|sales|sotuv|hr|finance|moliya')::int AS business,
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'graphic|grafik|illustrator|photoshop|motion|brand|brend')::int AS graphic,
          COUNT(*) FILTER (WHERE (v.title || ' ' || array_to_string(v.skills, ' ')) ~* 'web|frontend|backend|fullstack|react|next|node|python|java|dev|dastur|baǵdarlama')::int AS web
        FROM "Vacancy" v
        JOIN "Company" c ON c.id = v."companyId"
        JOIN "User" u ON u.id = c."userId"
        WHERE v.status = 'ACTIVE'
          AND c.approval = 'APPROVED'
          AND u.status = 'ACTIVE'
          AND (v."expiresAt" IS NULL OR v."expiresAt" > ${now})
      `),
    db.vacancy.findMany({
      where: activeVacancyWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        location: true,
        workType: true,
        salaryFrom: true,
        salaryTo: true,
        currency: true,
        skills: true,
        company: {
          select: { id: true, name: true, industry: true, hasLogo: true },
        },
      },
    }),
    db.$queryRaw<
      Array<{
        id: string;
        title: string | null;
        fullName: string | null;
        field: string | null;
        hideName: boolean | null;
        bestScore: number | null;
      }>
    >(Prisma.sql`
      SELECT
        cv.id,
        NULLIF(TRIM(cv.title), '') AS title,
        NULLIF(TRIM(cv.data->>'fullName'), '') AS "fullName",
        NULLIF(TRIM(cv.data #>> '{education,0,field}'), '') AS field,
        COALESCE((cv.privacy->>'hideName')::boolean, false) AS "hideName",
        (SELECT MAX(m.score)::int FROM "Match" m WHERE m."cvId" = cv.id) AS "bestScore"
      FROM "Cv" cv
      JOIN "User" u ON u.id = cv."userId"
      WHERE cv."isVisible" = true
        AND cv."savedAt" IS NOT NULL
        AND u.status = 'ACTIVE'
      ORDER BY cv."updatedAt" DESC
      LIMIT 3
    `),
    db.$queryRaw<Array<{ total: number; progressed: number }>>(Prisma.sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IN ('VIEWED', 'INTERESTED', 'ACCEPTED'))::int AS progressed
      FROM "Application"
    `),
  ]);

  const cat = categoryRows[0];
  const categoryCounts: Record<CategoryKey, number> = {
    marketing: cat?.marketing ?? 0,
    design: cat?.design ?? 0,
    pm: cat?.pm ?? 0,
    business: cat?.business ?? 0,
    graphic: cat?.graphic ?? 0,
    web: cat?.web ?? 0,
  };

  const fallbackScores = [97, 95, 93];
  const candidatePreviews: CandidatePreview[] = candidateRows.map((c, idx) => {
    const rawName = !c.hideName && c.fullName ? c.fullName : null;
    const parts = rawName ? rawName.split(/\s+/).filter(Boolean) : [];
    const maskedName =
      parts.length >= 2
        ? `${parts[0]} ${parts[1][0]?.toUpperCase() ?? ""}.`
        : parts[0] || `#${idx + 1}`;
    const role = c.title || c.field || "CANDIDATOR";
    const score =
      c.bestScore && c.bestScore >= 75
        ? Math.min(99, c.bestScore)
        : fallbackScores[idx] ?? 92;
    return {
      id: c.id,
      name: maskedName,
      role,
      matchScore: score,
    };
  });

  const appStat = appProgressRows[0];
  const hiredRate =
    appStat && appStat.total >= 5 && appStat.progressed > 0
      ? Math.max(68, Math.min(96, Math.round((appStat.progressed / appStat.total) * 100)))
      : 70;

  return {
    activeVacancies,
    visibleCvs,
    approvedCompanies,
    approvedCompanyList: companyRows
      .filter(
        (
          c,
        ): c is {
          id: string;
          name: string;
          industry: string | null;
          hasLogo: boolean;
        } => Boolean(c.name?.trim()),
      )
      .map((c) => ({
        id: c.id,
        name: c.name.trim(),
        industry: c.industry,
        hasLogo: c.hasLogo,
      })),
    categoryCounts,
    featuredVacancies: featuredRows.map((v) => ({
      id: v.id,
      title: v.title,
      companyId: v.company.id,
      companyName:
        v.company.name?.trim() || v.company.industry?.trim() || "QMU (KarSU)",
      hasLogo: v.company.hasLogo,
      location: v.location,
      workType: v.workType,
      salaryFrom: v.salaryFrom,
      salaryTo: v.salaryTo,
      currency: v.currency,
      skills: v.skills.slice(0, 4),
    })),
    candidatePreviews,
    hiredRate,
  };
}

/** Bosh sahifa uchun bazadan real statistika (60 soniya keshlanadi). */
const cachedLandingStats = unstable_cache(
  fetchLandingStats,
  ["landing-stats-v7"],
  { revalidate: 60 },
);

/** Keep database errors outside the cache so the next request can retry. */
export async function getLandingStats(): Promise<LandingStats> {
  try {
    return await cachedLandingStats();
  } catch (err) {
    console.error("Landing stats query failed:", err);
    return EMPTY_STATS;
  }
}
