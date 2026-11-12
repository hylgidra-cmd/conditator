import type { MatchDecision } from "@prisma/client";
import { z } from "zod";
import { loadVisibleCvDocument } from "@/backend/cv-document/load";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { getOwnVacancy } from "@/backend/vacancy/service";

export const decisionSchema = z.object({
  decision: z.enum(["NONE", "SELECTED", "REJECTED"]),
});

/**
 * "Tanlandi" / "Mos emas" belgisi. Faqat o'z talabi (aks holda 404) va faqat ochiq CV (aks holda 404).
 * Nomzod AI bilan baholanmagan bo'lsa (zaxira qidiruvdan), bo'sh hash bilan qator yaratiladi:
 * keyingi saralashda AI uni baholaydi, qaror esa saqlanib qoladi.
 */
export async function setDecision(
  companyId: string,
  vacancyId: string,
  cvId: string,
  decision: MatchDecision,
) {
  const vacancy = await getOwnVacancy(companyId, vacancyId);
  if (!(await loadVisibleCvDocument(cvId)))
    throw new ApiError(404, "NOT_FOUND");
  const match = await db.match.upsert({
    where: { vacancyId_cvId: { vacancyId: vacancy.id, cvId } },
    create: {
      vacancyId: vacancy.id,
      cvId,
      score: 0,
      reason: "",
      hash: "",
      decision,
    },
    update: { decision },
    select: { decision: true },
  });
  return match.decision;
}

export async function getDecision(
  vacancyId: string,
  cvId: string,
): Promise<MatchDecision> {
  const match = await db.match.findUnique({
    where: { vacancyId_cvId: { vacancyId, cvId } },
    select: { decision: true },
  });
  return match?.decision ?? "NONE";
}

export type DecisionCounts = { selected: number; rejected: number };

/** Talablar tarixi uchun: har bir talab bo'yicha qarorlar soni (faqat hozir ochiq CV lar). */
export async function decisionCounts(
  vacancyIds: string[],
): Promise<Map<string, DecisionCounts>> {
  const rows = await db.match.groupBy({
    by: ["vacancyId", "decision"],
    where: {
      vacancyId: { in: vacancyIds },
      decision: { not: "NONE" },
      cv: {
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
      },
    },
    _count: { _all: true },
  });
  const counts = new Map<string, DecisionCounts>();
  for (const row of rows) {
    const entry = counts.get(row.vacancyId) ?? { selected: 0, rejected: 0 };
    if (row.decision === "SELECTED") entry.selected = row._count._all;
    else entry.rejected = row._count._all;
    counts.set(row.vacancyId, entry);
  }
  return counts;
}

export type DecidedCandidate = {
  cvId: string;
  decision: MatchDecision;
  skills: string[];
  location: string | null;
  updatedAt: string;
};

/** Qaror qo'yilgan nomzodlar (saralash sahifasining pastida). */
export async function listDecided(
  vacancyId: string,
): Promise<DecidedCandidate[]> {
  const rows = await db.match.findMany({
    where: {
      vacancyId,
      decision: { not: "NONE" },
      cv: {
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
      },
    },
    orderBy: [{ decision: "asc" }, { updatedAt: "desc" }],
    take: 100,
    select: {
      cvId: true,
      decision: true,
      updatedAt: true,
      cv: { select: { skills: true, location: true } },
    },
  });
  return rows.map((row) => ({
    cvId: row.cvId,
    decision: row.decision,
    skills: row.cv.skills.slice(0, 12),
    location: row.cv.location,
    updatedAt: row.updatedAt.toISOString(),
  }));
}
