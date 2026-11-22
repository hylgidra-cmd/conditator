import "server-only";
import { z } from "zod";
import { db } from "@/backend/db";
import type { MatchOutcome } from "@/backend/match/service";
import type { CandidateReadinessFilter } from "@/backend/match/candidates";

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
): Promise<MatchOutcome> {
  if (outcome.results.length === 0) return outcome;
  const cvs = await db.cv.findMany({
    where: { id: { in: outcome.results.map((row) => row.cvId) } },
    select: { id: true, userId: true },
  });
  const ids = cvs.map((cv) => cv.userId);
  const results = await db.personalityResult.findMany({
    where: { userId: { in: ids }, archivedAt: null, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      userId: true,
      typeCode: true,
      identity: true,
      mindPct: true,
      energyPct: true,
      naturePct: true,
      tacticsPct: true,
      identityPct: true,
    },
  });
  const byUser = new Map(results.map((row) => [row.userId, row]));
  const userByCv = new Map(cvs.map((cv) => [cv.id, cv.userId]));
  return {
    ...outcome,
    results: outcome.results.map((item) => {
      const userId = userByCv.get(item.cvId);
      const result = userId ? byUser.get(userId) : null;
      return {
        ...item,
        personality: result
          ? {
              typeCode: result.typeCode,
              identity: result.identity,
              group:
                result.typeCode[1] === "N"
                  ? result.typeCode[2] === "T"
                    ? "NT"
                    : "NF"
                  : result.typeCode[3] === "J"
                    ? "SJ"
                    : "SP",
              mindPct: result.mindPct,
              energyPct: result.energyPct,
              naturePct: result.naturePct,
              tacticsPct: result.tacticsPct,
              identityPct: result.identityPct,
            }
          : null,
      };
    }),
  };
}
