import "server-only";
import { z } from "zod";
import { db } from "@/backend/db";
import type { MatchOutcome } from "@/backend/match/service";
import type { CandidateReadinessFilter } from "@/backend/match/candidates";
import {
  computePersonalityMatchPct,
  getGroupName,
  getLocaleKey,
  PERSONALITY_TYPE_BY_CODE,
} from "@/backend/personality/catalog";
import { personalityGroup } from "@/backend/personality/score";
import { personalityMatchWeightPct } from "@/backend/personality/service";

export const companyFiltersSchema = z.object({
  professionId: z.string().max(100).optional(),
  personalityGroup: z.enum(["NT", "NF", "SJ", "SP"]).optional(),
  typeCode: z
    .string()
    .regex(/^[IE][NS][TF][JP]$/)
    .optional(),
  language: z.string().max(50).optional(),
  languageBand: z.enum(["NATIVE_ONLY", "ONE", "TWO_PLUS"]).optional(),
  experienceBand: z
    .enum(["NONE", "UNDER_1", "ONE_TO_THREE", "OVER_3"])
    .optional(),
});

export function parseCompanyFilters(
  params: URLSearchParams,
): CandidateReadinessFilter {
  const fields = Object.fromEntries(
    [...params].filter(
      ([key, value]) => value && key in companyFiltersSchema.shape,
    ),
  );
  return companyFiltersSchema.parse(fields);
}

export async function attachCompanyPersonality(
  outcome: MatchOutcome,
  options?: {
    vacancy?: { wantedTypes: string[]; wantedGroups: string[] } | null;
    locale?: string | null;
    onlyPersonalityMatch?: boolean;
  },
): Promise<MatchOutcome> {
  if (outcome.results.length === 0) return outcome;
  const locale = getLocaleKey(options?.locale);
  const wantedTypes = options?.vacancy?.wantedTypes ?? [];
  const wantedGroups = options?.vacancy?.wantedGroups ?? [];
  const hasWanted = wantedTypes.length > 0 || wantedGroups.length > 0;

  const cvs = await db.cv.findMany({
    where: { id: { in: outcome.results.map((row) => row.cvId) } },
    select: { id: true, userId: true },
  });
  const ids = cvs.map((cv) => cv.userId);
  const [results, dbTypes, weightPct] = await Promise.all([
    db.personalityResult.findMany({
      where: { userId: { in: ids }, archivedAt: null, invalidatedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        typeCode: true,
        mindPct: true,
        energyPct: true,
        naturePct: true,
        tacticsPct: true,
        identityPct: true,
      },
    }),
    db.personalityType.findMany(),
    hasWanted ? personalityMatchWeightPct() : Promise.resolve(0),
  ]);

  const dbTypeMap = new Map(dbTypes.map((t) => [t.code, t]));
  const byUser = new Map<string, (typeof results)[number]>();
  for (const row of results) {
    if (!byUser.has(row.userId)) byUser.set(row.userId, row);
  }
  const userByCv = new Map(cvs.map((cv) => [cv.id, cv.userId]));

  let enriched = outcome.results.map((item) => {
    const userId = userByCv.get(item.cvId);
    const result = userId ? byUser.get(userId) : null;

    if (!result) {
      const match = hasWanted
        ? computePersonalityMatchPct(null, wantedTypes, wantedGroups)
        : null;
      return {
        ...item,
        personality: match
          ? {
              typeName: "",
              groupName: "",
              group: "",
              mindPct: 0,
              energyPct: 0,
              naturePct: 0,
              tacticsPct: 0,
              identityPct: 0,
              personalityMatchPct: match.matchPct,
              isPersonalityMatch: false,
            }
          : null,
      };
    }

    const group = personalityGroup(result.typeCode);
    const dbT = dbTypeMap.get(result.typeCode);
    const fallback = PERSONALITY_TYPE_BY_CODE.get(result.typeCode);
    const typeName = dbT
      ? locale === "kk"
        ? dbT.titleKk
        : locale === "ru"
          ? dbT.titleRu
          : locale === "en"
            ? dbT.titleEn
            : dbT.titleUz
      : (fallback?.title[locale] ?? "");

    const match = hasWanted
      ? computePersonalityMatchPct(result.typeCode, wantedTypes, wantedGroups)
      : null;

    const blendedScore =
      match && weightPct > 0
        ? Math.min(
            100,
            Math.round(
              item.score * (1 - weightPct / 100) +
                match.matchPct * (weightPct / 100),
            ),
          )
        : item.score;

    return {
      ...item,
      score: blendedScore,
      personality: {
        typeName,
        groupName: getGroupName(group, locale),
        group,
        mindPct: result.mindPct,
        energyPct: result.energyPct,
        naturePct: result.naturePct,
        tacticsPct: result.tacticsPct,
        identityPct: result.identityPct,
        personalityMatchPct: match ? match.matchPct : null,
        isPersonalityMatch: Boolean(match?.isExactMatch),
      },
    };
  });

  if (options?.onlyPersonalityMatch && hasWanted) {
    enriched = enriched.filter((item) => item.personality?.isPersonalityMatch);
  }

  // Teng foizlilar ichida "Xarakteri mos" nomzod birinchi turadi
  enriched.sort(
    (a, b) =>
      b.score - a.score ||
      Number(Boolean(b.personality?.isPersonalityMatch)) -
        Number(Boolean(a.personality?.isPersonalityMatch)),
  );

  return {
    ...outcome,
    results: enriched,
  };
}
