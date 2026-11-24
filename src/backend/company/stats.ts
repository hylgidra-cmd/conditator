import "server-only";
import { db } from "@/backend/db";
import {
  getGroupName,
  getLocaleKey,
  PERSONALITY_GROUPS,
  PERSONALITY_TYPE_CATALOG,
  type LocaleKey,
  type PersonalityGroupCode,
} from "@/backend/personality/catalog";

export type CompanyStatsFilters = {
  region?: string;
  language?: string;
  experienceBand?: "NONE" | "UNDER_1" | "ONE_TO_THREE" | "OVER_3";
  personalityGroup?: PersonalityGroupCode;
};

type SnapshotStudentRow = {
  userId: string;
  region: string | null;
  skills: string[];
  languages: string[];
  experienceBand: string | null;
  personalityGroup: string | null;
  typeCode: string | null;
  professionIds: string[];
};

type SnapshotPayload = {
  generatedAt: string;
  students: SnapshotStudentRow[];
};

const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Har kecha cron orqali (yoki snapshot yo'q/eskirgan bo'lsa avtomatik)
 * butun Candidator talabalarining anonim statistik snapshotini hisoblaydi.
 */
export async function refreshCompanyStatsSnapshot(): Promise<SnapshotPayload> {
  const [cvs, readinessRows, personalityRows, userLangRows] = await Promise.all(
    [
      db.cv.findMany({
        where: {
          savedAt: { not: null },
          user: { role: "STUDENT", status: "ACTIVE" },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          userId: true,
          location: true,
          skills: true,
          languages: true,
        },
      }),
      db.readinessProfile.findMany({
        select: {
          userId: true,
          professionId: true,
          personalityGroup: true,
          typeCode: true,
          experienceBand: true,
        },
      }),
      db.personalityResult.findMany({
        where: { archivedAt: null, invalidatedAt: null },
        orderBy: { createdAt: "desc" },
        select: { userId: true, typeCode: true },
      }),
      db.userLanguage.findMany({
        select: { userId: true, language: true },
      }),
    ],
  );

  const byUser = new Map<string, SnapshotStudentRow>();

  function ensureUser(userId: string): SnapshotStudentRow {
    let row = byUser.get(userId);
    if (!row) {
      row = {
        userId,
        region: null,
        skills: [],
        languages: [],
        experienceBand: null,
        personalityGroup: null,
        typeCode: null,
        professionIds: [],
      };
      byUser.set(userId, row);
    }
    return row;
  }

  for (const cv of cvs) {
    const row = ensureUser(cv.userId);
    if (!row.region && cv.location) row.region = cv.location.trim();
    const skillSet = new Set(row.skills);
    for (const s of cv.skills) {
      const clean = s.trim();
      if (clean) skillSet.add(clean);
    }
    row.skills = [...skillSet];
    const langSet = new Set(row.languages);
    for (const l of cv.languages) {
      const clean = l.trim().toLowerCase();
      if (clean) langSet.add(clean);
    }
    row.languages = [...langSet];
  }

  for (const ul of userLangRows) {
    const row = byUser.get(ul.userId);
    if (!row) continue;
    const clean = ul.language.trim().toLowerCase();
    if (clean && !row.languages.includes(clean)) row.languages.push(clean);
  }

  for (const pr of personalityRows) {
    const row = byUser.get(pr.userId);
    if (!row || row.typeCode) continue;
    row.typeCode = pr.typeCode;
    row.personalityGroup =
      pr.typeCode[1] === "N"
        ? pr.typeCode[2] === "T"
          ? "NT"
          : "NF"
        : pr.typeCode[3] === "J"
          ? "SJ"
          : "SP";
  }

  for (const rp of readinessRows) {
    const row = ensureUser(rp.userId);
    if (!row.experienceBand) row.experienceBand = rp.experienceBand;
    if (!row.personalityGroup) row.personalityGroup = rp.personalityGroup;
    if (!row.typeCode) row.typeCode = rp.typeCode;
    if (!row.professionIds.includes(rp.professionId)) {
      row.professionIds.push(rp.professionId);
    }
  }

  const payload: SnapshotPayload = {
    generatedAt: new Date().toISOString(),
    students: [...byUser.values()],
  };

  await db.companyStatsSnapshot.upsert({
    where: { id: "latest" },
    create: { id: "latest", payload: payload as unknown as object },
    update: { payload: payload as unknown as object },
  });

  return payload;
}

async function loadSnapshot(): Promise<SnapshotPayload> {
  const existing = await db.companyStatsSnapshot.findUnique({
    where: { id: "latest" },
  });
  if (
    existing &&
    Date.now() - existing.updatedAt.getTime() < SNAPSHOT_MAX_AGE_MS &&
    existing.payload &&
    typeof existing.payload === "object"
  ) {
    return existing.payload as unknown as SnapshotPayload;
  }
  return refreshCompanyStatsSnapshot();
}

function maskCount(raw: number, isAdmin: boolean) {
  if (!isAdmin && raw > 0 && raw < 5) {
    return { count: null as number | null, display: "<5", masked: true };
  }
  return { count: raw, display: String(raw), masked: false };
}

export async function queryCompanyStats(
  filters: CompanyStatsFilters,
  localeInput: string | null | undefined,
  options: { isAdmin: boolean },
) {
  const locale: LocaleKey = getLocaleKey(localeInput);
  const [snapshot, professions, dbTypes] = await Promise.all([
    loadSnapshot(),
    db.profession.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }],
      select: {
        id: true,
        parentId: true,
        nameUz: true,
        nameKk: true,
        nameRu: true,
        nameEn: true,
      },
    }),
    db.personalityType.findMany({ orderBy: { code: "asc" } }),
  ]);

  const regionQ = filters.region?.trim().toLowerCase() ?? "";
  const langQ = filters.language?.trim().toLowerCase() ?? "";

  const filtered = snapshot.students.filter((s) => {
    if (regionQ && !(s.region ?? "").toLowerCase().includes(regionQ)) {
      return false;
    }
    if (langQ && !s.languages.some((l) => l.includes(langQ))) {
      return false;
    }
    if (filters.experienceBand && s.experienceBand !== filters.experienceBand) {
      return false;
    }
    if (
      filters.personalityGroup &&
      s.personalityGroup !== filters.personalityGroup
    ) {
      return false;
    }
    return true;
  });

  // 1. Kasblar (Soha -> Kasb papkasi, kamayish tartibida)
  const profCounts = new Map<string, number>();
  for (const s of filtered) {
    for (const pid of s.professionIds) {
      profCounts.set(pid, (profCounts.get(pid) ?? 0) + 1);
    }
  }

  const locName = (p: {
    nameUz: string;
    nameKk: string;
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

  const parentMap = new Map(
    professions.filter((p) => !p.parentId).map((p) => [p.id, locName(p)]),
  );

  const professionStats = professions
    .filter((p) => Boolean(p.parentId))
    .map((p) => {
      const raw = profCounts.get(p.id) ?? 0;
      const m = maskCount(raw, options.isAdmin);
      return {
        professionId: p.id,
        areaName: parentMap.get(p.parentId!) ?? "",
        professionName: locName(p),
        rawCount: raw,
        ...m,
      };
    })
    .filter((row) => row.rawCount > 0)
    .sort((a, b) => b.rawCount - a.rawCount)
    .map((row) => ({
      professionId: row.professionId,
      areaName: row.areaName,
      professionName: row.professionName,
      count: row.count,
      display: row.display,
      masked: row.masked,
    }));

  // 2. Ko'nikmalar TOP 30
  const skillMap = new Map<string, { label: string; count: number }>();
  for (const s of filtered) {
    const seen = new Set<string>();
    for (const skill of s.skills) {
      const key = skill.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const cur = skillMap.get(key);
      if (cur) cur.count += 1;
      else skillMap.set(key, { label: skill, count: 1 });
    }
  }
  const skillStats = [...skillMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
    .map((item) => ({
      skill: item.label,
      ...maskCount(item.count, options.isAdmin),
    }));

  // 3. Xarakter (4 guruh va 16 tip — oddiy nomlar bilan)
  const groupCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const s of filtered) {
    if (s.personalityGroup) {
      groupCounts.set(
        s.personalityGroup,
        (groupCounts.get(s.personalityGroup) ?? 0) + 1,
      );
    }
    if (s.typeCode) {
      typeCounts.set(s.typeCode, (typeCounts.get(s.typeCode) ?? 0) + 1);
    }
  }

  const groupStats = (["NT", "NF", "SJ", "SP"] as PersonalityGroupCode[]).map(
    (code) => {
      const raw = groupCounts.get(code) ?? 0;
      return {
        groupCode: code,
        groupName: PERSONALITY_GROUPS[code].name[locale],
        groupSummary: PERSONALITY_GROUPS[code].summary[locale],
        ...maskCount(raw, options.isAdmin),
      };
    },
  );

  const dbTypeMap = new Map(dbTypes.map((t) => [t.code, t]));
  const typeStats = PERSONALITY_TYPE_CATALOG.map((item) => {
    const dbT = dbTypeMap.get(item.code);
    const title = dbT
      ? locale === "kk"
        ? dbT.titleKk
        : locale === "ru"
          ? dbT.titleRu
          : locale === "en"
            ? dbT.titleEn
            : dbT.titleUz
      : item.title[locale];
    const raw = typeCounts.get(item.code) ?? 0;
    return {
      groupCode: item.group,
      groupName: getGroupName(item.group, locale),
      typeName: title,
      ...(options.isAdmin ? { typeCode: item.code } : {}),
      // Filter link uses internal code as query param only if needed, or groupCode
      filterCode: item.code,
      rawCount: raw,
      ...maskCount(raw, options.isAdmin),
    };
  })
    .sort((a, b) => b.rawCount - a.rawCount)
    .map((row) => ({
      groupCode: row.groupCode,
      groupName: row.groupName,
      typeName: row.typeName,
      ...(row.typeCode ? { typeCode: row.typeCode } : {}),
      filterCode: row.filterCode,
      count: row.count,
      display: row.display,
      masked: row.masked,
    }));

  // Available filter options (regions & languages)
  const regionsSet = new Set<string>();
  const langsSet = new Set<string>();
  for (const s of snapshot.students) {
    if (s.region) regionsSet.add(s.region);
    for (const l of s.languages) langsSet.add(l);
  }

  return {
    updatedAt: snapshot.generatedAt,
    totalStudents: maskCount(filtered.length, options.isAdmin),
    professions: professionStats,
    skills: skillStats,
    groups: groupStats,
    types: typeStats,
    availableRegions: [...regionsSet].sort().slice(0, 60),
    availableLanguages: [...langsSet].sort().slice(0, 30),
  };
}
