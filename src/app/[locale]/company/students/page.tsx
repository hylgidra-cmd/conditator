import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireCompanyPage } from "@/backend/company/page";
import { parsePrivacy, sanitizeCvData } from "@/backend/cv/privacy";
import { evaluateCvQuality } from "@/backend/cv/quality";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import { personalityGroup as getPersonalityGroup } from "@/backend/personality/score";
import {
  type CandidateExplorerItem,
  CompanyStudentsExplorer,
  type DirectionKey,
} from "@/frontend/components/company/company-students-explorer";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CompanyTalentExplorer");
  return { title: t("heroTitle") };
}

function normalizeRegion(raw: string | null | undefined): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("toshkent") || lower.includes("tashkent"))
    return "Toshkent";
  if (lower.includes("samarqand") || lower.includes("samarkand"))
    return "Samarqand";
  if (lower.includes("buxoro") || lower.includes("bukhara")) return "Buxoro";
  if (lower.includes("andijon") || lower.includes("andijan")) return "Andijon";
  if (lower.includes("nukus") || lower.includes("no'kis") || lower.includes("nukis") || lower.includes("qoraqalpoq"))
    return "Nukus";
  if (lower.includes("farg")) return "Farg'ona";
  if (lower.includes("namangan")) return "Namangan";
  if (lower.includes("xorazm") || lower.includes("urganch")) return "Xorazm";
  if (lower.includes("qashqadaryo") || lower.includes("qarshi"))
    return "Qashqadaryo";
  if (lower.includes("navoiy")) return "Navoiy";
  return raw.split(",")[0]?.trim() || "";
}

function detectDirections(haystack: string): DirectionKey[] {
  const h = haystack.toLowerCase();
  const dirs: DirectionKey[] = [];

  if (
    /(frontend|backend|fullstack|dasturchi|developer|software|react|node|javascript|typescript|python|java|php|golang|html|css|mobile|flutter|ios|android|qa|devops)/.test(
      h,
    )
  ) {
    dirs.push("dev");
  }
  if (/(dizayn|design|figma|ui\/ux|ux|grafik|illustrator|photoshop|3d)/.test(h)) {
    dirs.push("design");
  }
  if (/(product|mahsulot|project manager|agile|scrum|jira|pm|ba)/.test(h)) {
    dirs.push("product");
  }
  if (
    /(data|analitik|analytics|sql|power bi|tableau|machine learning|scikit|excel|statistika|bi)/.test(
      h,
    )
  ) {
    dirs.push("data");
  }
  if (/(marketing|smm|target|seo|kontent|copywrit|brand|pr|sotuv|sales)/.test(h)) {
    dirs.push("marketing");
  }
  if (
    /(moliya|finance|buxgalter|accounting|audit|bank|iqtisod|hr|boshqaruv|menejer)/.test(
      h,
    )
  ) {
    dirs.push("finance");
  }

  if (dirs.length === 0) dirs.push("dev");
  return dirs;
}

function formatCompactName(name: string): string {
  const clean = name.trim();
  if (!clean) return "";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const second = parts[1];
    if (first && second && !first.endsWith(".") && !second.endsWith(".")) {
      return `${first[0]?.toUpperCase()}. ${second}`;
    }
  }
  return clean;
}

function extractInitials(name: string, fallbackRole: string): string {
  const source = name.replace(/[()]/g, " ").trim() || fallbackRole.trim();
  const parts = source
    .split(/[\s.]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "CV";
}

export default async function CompanyStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
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
  const tExplorer = await getTranslations("CompanyTalentExplorer");
  const {
    q,
    location,
    professionId,
    personalityGroup,
    typeCode,
    language,
    languageBand,
    experienceBand,
  } = await searchParams;
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
            {tExplorer("heroTitle")}
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

  const [cvs, hasActiveAbuna, companyVacancies] = await Promise.all([
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
      },
      orderBy: { savedAt: "desc" },
      take: 100,
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
        skillMatches: {
          ...(professionId ? { where: { professionId } } : {}),
          orderBy: { matchedCount: "desc" },
          take: 1,
          select: { matchedCount: true },
        },
        user: {
          select: {
            fullName: true,
            city: true,
            educationSummary: true,
            avatarUrl: true,
            personalityResults: {
              where: { archivedAt: null, invalidatedAt: null },
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                typeCode: true,
                identity: true,
              },
            },
          },
        },
      },
    }),
    isCompanySubscribedOrUnlocked(company.id),
    db.vacancy.findMany({
      where: { companyId: company.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, title: true },
    }),
  ]);

  const cvIds = cvs.map((c) => c.id);
  const [companyMatches, likedRows] =
    cvIds.length > 0
      ? await Promise.all([
          db.match.findMany({
            where: {
              vacancy: { companyId: company.id },
              cvId: { in: cvIds },
            },
            select: { cvId: true, score: true, reason: true },
            orderBy: { score: "desc" },
          }),
          db.candidateLike.findMany({
            where: {
              companyId: company.id,
              cvId: { in: cvIds },
            },
            select: { cvId: true },
          }),
        ])
      : [[], []];

  const bestMatchByCv = new Map<string, { score: number; reason: string }>();
  for (const m of companyMatches) {
    if (!bestMatchByCv.has(m.cvId)) {
      bestMatchByCv.set(m.cvId, { score: m.score, reason: m.reason });
    }
  }

  const candidateFallback = tExplorer("candidateFallback");
  const roleFallback = tExplorer("roleFallback");

  const candidates: CandidateExplorerItem[] = cvs
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
            score: 55,
            isMukammal: false,
          };

      const isLocked = !hasActiveAbuna;
      const privacy = parsePrivacy(cv.privacy);
      const safe = parsed.success
        ? sanitizeCvData(parsed.data, { privacy, isLocked })
        : null;

      const rawFullName =
        !isLocked && !privacy.hideName
          ? safe?.fullName || cv.user.fullName || candidateFallback
          : safe?.fullName || candidateFallback;

      const cleanTitle =
        cv.title && cv.title !== "Mening rezyumem"
          ? cv.title
          : safe?.experience[0]?.position || roleFallback;

      const displayLocation = privacy.hideAddress
        ? null
        : safe?.location || cv.location || cv.user.city || null;

      const educationList =
        safe?.education && safe.education.length > 0
          ? safe.education
          : cv.user.educationSummary
            ? [
                {
                  institution: cv.user.educationSummary,
                  degree: null,
                  field: null,
                  startYear: null,
                  endYear: null,
                },
              ]
            : [];

      const mergedSkills =
        cv.skills.length > 0 ? cv.skills : (safe?.skills ?? []);

      const langList =
        safe?.languages && safe.languages.length > 0
          ? safe.languages
          : cv.languages.map((l) => ({ name: l, level: null }));

      const pers = cv.user.personalityResults[0] ?? null;
      const personalityLabel = pers
        ? `${getPersonalityGroup(pers.typeCode)} · ${pers.typeCode}-${pers.identity}`
        : null;

      const directionHaystack = [
        cleanTitle,
        safe?.goal ?? "",
        ...mergedSkills,
        ...(safe?.projects ?? []).map((p) => `${p.name} ${p.description ?? ""}`),
        ...(safe?.experience ?? []).map(
          (e) => `${e.position ?? ""} ${e.organization}`,
        ),
      ].join(" ");

      const photo =
        !isLocked && !privacy.hidePhoto
          ? safe?.photo || cv.user.avatarUrl || null
          : null;

      return {
        id: cv.id,
        fullName: rawFullName,
        shortName: isLocked ? rawFullName : formatCompactName(rawFullName),
        initials: extractInitials(
          !privacy.hideName
            ? parsed.success
              ? parsed.data.fullName || cv.user.fullName || ""
              : cv.user.fullName || ""
            : "",
          cleanTitle,
        ),
        photo,
        roleTitle: cleanTitle,
        about: safe?.goal || "",
        location: displayLocation,
        regionKey: normalizeRegion(displayLocation),
        workTypes:
          cv.workTypes.length > 0 ? cv.workTypes : ["FULL_TIME" as const],
        skills: mergedSkills,
        languages: langList,
        education: educationList,
        experience: safe?.experience ?? [],
        projects: safe?.projects ?? [],
        contact: {
          email: safe?.contact.email ?? null,
          phone: safe?.contact.phone ?? null,
          telegram: safe?.contact.telegram || safe?.telegram || null,
          github: safe?.contact.github || safe?.github || null,
        },
        personalityLabel,
        aiScore: quality.score,
        skillMatchCount: cv.skillMatches[0]?.matchedCount ?? null,
        isMukammal: quality.isMukammal,
        isLocked,
        directionKeys: detectDirections(directionHaystack),
        savedAtMs: cv.savedAt ? cv.savedAt.getTime() : 0,
      };
    })
    .sort((a, b) => {
      if (b.aiScore !== a.aiScore) return b.aiScore - a.aiScore;
      return b.savedAtMs - a.savedAtMs;
    });

  return (
    <CompanyStudentsExplorer
      candidates={candidates}
      initialLikedIds={likedRows.map((r) => r.cvId)}
      hasActiveSubscription={hasActiveAbuna}
      companyVacancies={companyVacancies}
      initialQuery={q ?? ""}
      initialRegion={normalizeRegion(location)}
    />
  );
}
