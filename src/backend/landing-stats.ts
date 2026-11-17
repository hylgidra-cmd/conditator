import { unstable_cache } from "next/cache";
import { db } from "@/backend/db";

export type CategoryKey =
  | "marketing"
  | "design"
  | "pm"
  | "business"
  | "graphic"
  | "web";

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

export type LandingStats = {
  activeVacancies: number;
  visibleCvs: number;
  approvedCompanies: number;
  approvedCompanyList: ApprovedCompanyBadge[];
  categoryCounts: Record<CategoryKey, number>;
  featuredVacancies: FeaturedVacancy[];
};

const CATEGORY_KEYWORDS: Record<CategoryKey, RegExp> = {
  marketing: /marketing|smm|seo|target|reklama|copywrit/i,
  design: /ui\/?ux|figma|product design|dizayn|design/i,
  pm: /project|product|scrum|agile|loyiha|joybar|manager|menejer/i,
  business: /business|biznes|konsalting|consult|sales|sotuv|hr|finance|moliya/i,
  graphic: /graphic|grafik|illustrator|photoshop|motion|brand|brend/i,
  web: /web|frontend|backend|fullstack|react|next|node|python|java|dev|dastur|baǵdarlama/i,
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
};

async function fetchLandingStats(): Promise<LandingStats> {
  try {
    const now = new Date();
    const activeVacancyWhere = {
      status: "ACTIVE" as const,
      company: { approval: "APPROVED" as const },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [
      activeVacancies,
      visibleCvs,
      approvedCompanies,
      companyRows,
      vacancies,
      featuredRows,
    ] = await Promise.all([
      db.vacancy.count({ where: activeVacancyWhere }),
      db.cv.count({
        where: {
          isVisible: true,
          savedAt: { not: null },
          user: { status: "ACTIVE" },
        },
      }),
      db.company.count({ where: { approval: "APPROVED" } }),
      db.company.findMany({
        where: { approval: "APPROVED", name: { not: null } },
        orderBy: { approvedAt: "desc" },
        take: 10,
        select: { id: true, name: true, industry: true, logoPath: true },
      }),
      db.vacancy.findMany({
        where: activeVacancyWhere,
        select: { title: true, skills: true },
      }),
      db.vacancy.findMany({
        where: activeVacancyWhere,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          location: true,
          workType: true,
          salaryFrom: true,
          salaryTo: true,
          currency: true,
          skills: true,
          company: { select: { id: true, name: true, logoPath: true } },
        },
      }),
    ]);

    const categoryCounts: Record<CategoryKey, number> = {
      marketing: 0,
      design: 0,
      pm: 0,
      business: 0,
      graphic: 0,
      web: 0,
    };

    for (const v of vacancies) {
      const haystack = `${v.title} ${v.skills.join(" ")}`;
      (Object.keys(CATEGORY_KEYWORDS) as CategoryKey[]).forEach((key) => {
        if (CATEGORY_KEYWORDS[key].test(haystack)) {
          categoryCounts[key] += 1;
        }
      });
    }

    return {
      activeVacancies,
      visibleCvs,
      approvedCompanies,
      approvedCompanyList: companyRows
        .filter((c): c is { id: string; name: string; industry: string | null; logoPath: string | null } => Boolean(c.name?.trim()))
        .map((c) => ({
          id: c.id,
          name: c.name.trim(),
          industry: c.industry,
          hasLogo: Boolean(c.logoPath),
        })),
      categoryCounts,
      featuredVacancies: featuredRows.map((v) => ({
        id: v.id,
        title: v.title,
        companyId: v.company.id,
        companyName: v.company.name?.trim() || "—",
        hasLogo: Boolean(v.company.logoPath),
        location: v.location,
        workType: v.workType,
        salaryFrom: v.salaryFrom,
        salaryTo: v.salaryTo,
        currency: v.currency,
        skills: v.skills.slice(0, 4),
      })),
    };
  } catch (err) {
    console.error("Landing stats query failed:", err);
    return EMPTY_STATS;
  }
}

/** Bosh sahifa uchun bazadan real statistika (60 soniya keshlanadi). */
export const getLandingStats = unstable_cache(
  fetchLandingStats,
  ["landing-stats-v3"],
  { revalidate: 60 },
);
