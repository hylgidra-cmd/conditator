import { createHash } from "node:crypto";
import type { Company, Lang, Vacancy } from "@prisma/client";
import {
  MATCH_BATCH_SIZE,
  MATCH_PROMPT_VERSION,
  scoreBatch,
} from "@/lib/ai/match";
import { modelFor } from "@/lib/ai/provider";
import { AiError } from "@/lib/ai/run";
import { companyAccess } from "@/lib/company/access";
import { cvDataSchema } from "@/lib/cv/schema";
import { db } from "@/lib/db";
import {
  type CandidateRow,
  type FilterStats,
  filterCandidates,
} from "./candidates";

/** Sahifada ko'rsatiladigan eng yaxshi nomzodlar soni. */
export const MATCH_SHOW = 10;

export type MatchNotice =
  "AI_LIMIT_REACHED" | "AI_UNAVAILABLE" | "NO_SUBSCRIPTION";

export type MatchItem = {
  cvId: string;
  score: number;
  /** AI izohi (AI rejimida). */
  reason: string | null;
  /** Mos kelgan kalit so'zlar (zaxira qidiruv rejimida). */
  matchedTerms: string[] | null;
  skills: string[];
  location: string | null;
};

export type MatchOutcome = {
  /** ai = bazadagi AI natijalari; fallback = kalit so'z qidiruvi (saqlanmaydi). */
  mode: "ai" | "fallback";
  notice: MatchNotice | null;
  results: MatchItem[];
  stats: FilterStats;
  /** AI ga yuboriladigan (≤ 30) nomzodlar. */
  considered: number;
  /** Ulardan AI natijasi yo'q yoki eskirganlar (yangi/o'zgargan CV yoki talab). */
  pending: number;
};

/**
 * Kesh kaliti: talab versiyasi + CV versiyasi (+ prompt, model va izoh tili).
 * Bittasi o'zgarsa, faqat shu juftlik uchun AI qayta chaqiriladi.
 */
export function matchHash(
  vacancy: Pick<Vacancy, "id" | "updatedAt">,
  cv: { id: string; savedAt: Date },
  locale: Lang,
): string {
  return createHash("sha256")
    .update(
      [
        MATCH_PROMPT_VERSION,
        modelFor("MATCH"),
        locale,
        `${vacancy.id}:${vacancy.updatedAt.toISOString()}`,
        `${cv.id}:${cv.savedAt.toISOString()}`,
      ].join("|"),
    )
    .digest("hex");
}

function displayInfo(row: CandidateRow) {
  return { skills: row.skills.slice(0, 12), location: row.location };
}

/** Zaxira: PostgreSQL da hisoblangan kalit so'z mosligi bo'yicha tartib. AI chaqirilmaydi. */
function keywordResults(
  candidates: CandidateRow[],
  terms: string[],
): MatchItem[] {
  return candidates
    .map((row, order) => ({
      order,
      item: {
        cvId: row.id,
        score: terms.length
          ? Math.round((100 * row.matchedTerms.length) / terms.length)
          : 0,
        reason: null,
        matchedTerms: row.matchedTerms,
        ...displayInfo(row),
      },
    }))
    .sort((a, b) => b.item.score - a.item.score || a.order - b.order)
    .slice(0, MATCH_SHOW)
    .map(({ item }) => item);
}

async function loadState(vacancy: Vacancy, locale: Lang) {
  const { candidates, stats, terms } = await filterCandidates(vacancy);
  const hashes = new Map(
    candidates.map((row) => [row.id, matchHash(vacancy, row, locale)]),
  );
  const stored = await db.match.findMany({
    where: {
      vacancyId: vacancy.id,
      cvId: { in: candidates.map((row) => row.id) },
    },
  });
  const valid = stored.filter((match) => hashes.get(match.cvId) === match.hash);
  const validIds = new Set(valid.map((match) => match.cvId));
  return {
    candidates,
    stats,
    terms,
    hashes,
    valid,
    stale: candidates.filter((row) => !validIds.has(row.id)),
  };
}

type State = Awaited<ReturnType<typeof loadState>>;

function aiOutcome(state: State): MatchOutcome {
  const rows = new Map(state.candidates.map((row) => [row.id, row]));
  const results = [...state.valid]
    .sort((a, b) => b.score - a.score || a.cvId.localeCompare(b.cvId))
    .slice(0, MATCH_SHOW)
    .map((match) => ({
      cvId: match.cvId,
      score: match.score,
      reason: match.reason,
      matchedTerms: null,
      ...displayInfo(rows.get(match.cvId)!),
    }));
  return {
    mode: "ai",
    notice: null,
    results,
    stats: state.stats,
    considered: state.candidates.length,
    pending: state.stale.length,
  };
}

function fallbackOutcome(state: State, notice: MatchNotice): MatchOutcome {
  return {
    mode: "fallback",
    notice,
    results: keywordResults(state.candidates, state.terms),
    stats: state.stats,
    considered: state.candidates.length,
    pending: state.stale.length,
  };
}

/** Sahifa ochilganda: faqat bazadagi natijalar, AI chaqirilmaydi. */
export async function getMatchResults(
  company: Company,
  vacancy: Vacancy,
  locale: Lang,
): Promise<MatchOutcome> {
  const state = await loadState(vacancy, locale);
  if (!companyAccess(company).canRunMatching)
    return fallbackOutcome(state, "NO_SUBSCRIPTION");
  return aiOutcome(state);
}

async function scoreStale(
  state: State,
  vacancy: Vacancy,
  locale: Lang,
  userId: string,
) {
  const cvs = await db.cv.findMany({
    where: { id: { in: state.stale.map((row) => row.id) } },
    select: { id: true, data: true },
  });
  const byId = new Map(cvs.map((cv) => [cv.id, cv]));
  // SQL tartibi saqlanadi: eng mos nomzodlar birinchi guruhlarda.
  const prepared = state.stale.flatMap((row) => {
    const cv = byId.get(row.id);
    const data = cvDataSchema.safeParse(cv?.data);
    if (!cv || !data.success) return [];
    return [{ cvId: cv.id, data: data.data, names: [data.data.fullName] }];
  });

  const batches: (typeof prepared)[] = [];
  for (let i = 0; i < prepared.length; i += MATCH_BATCH_SIZE)
    batches.push(prepared.slice(i, i + MATCH_BATCH_SIZE));

  const settled = await Promise.allSettled(
    batches.map(async (candidates) => {
      const scores = await scoreBatch({ vacancy, candidates, locale, userId });
      // Muvaffaqiyatli guruh darhol saqlanadi: boshqa guruh xato bersa ham qayta to'lanmaydi.
      await db.$transaction(
        scores.map((score) => {
          const hash = state.hashes.get(score.cvId)!;
          const values = { score: score.score, reason: score.reason, hash };
          return db.match.upsert({
            where: {
              vacancyId_cvId: { vacancyId: vacancy.id, cvId: score.cvId },
            },
            create: { vacancyId: vacancy.id, cvId: score.cvId, ...values },
            // Kompaniya qarori (decision) o'zgarmaydi.
            update: values,
          });
        }),
      );
    }),
  );

  const errors = settled.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (errors.length === 0) return null;
  for (const error of errors) if (!(error instanceof AiError)) throw error;
  return errors.some((error) => error.code === "AI_LIMIT_REACHED")
    ? ("AI_LIMIT_REACHED" as const)
    : ("AI_UNAVAILABLE" as const);
}

// Bir talab uchun bir vaqtda faqat bitta saralash. Ketma-ket bosilsa, ikkinchisi birinchisining natijasini kutadi.
// Eslatma: bitta server jarayoni ichida ishlaydi (MVP: bitta konteyner).
const running = new Map<string, Promise<MatchOutcome>>();

export function isMatchingRunning(vacancyId: string): boolean {
  return running.has(vacancyId);
}

/**
 * "Saralash" / "Yangilash": faqat AI natijasi yo'q yoki eskirgan nomzodlar uchun AI chaqiriladi.
 * AI xato bersa yoki limit tugasa — xatosiz kalit so'z qidiruviga o'tadi (notice bilan).
 */
export function runMatching(params: {
  company: Company;
  vacancy: Vacancy;
  locale: Lang;
  userId: string;
}): Promise<MatchOutcome> {
  const key = params.vacancy.id;
  const existing = running.get(key);
  if (existing) return existing;

  const task = (async () => {
    const { company, vacancy, locale, userId } = params;
    const state = await loadState(vacancy, locale);
    if (!companyAccess(company).canRunMatching)
      return fallbackOutcome(state, "NO_SUBSCRIPTION");
    if (state.stale.length === 0) return aiOutcome(state);

    const failure = await scoreStale(state, vacancy, locale, userId);
    const after = await loadState(vacancy, locale);
    return failure ? fallbackOutcome(after, failure) : aiOutcome(after);
  })().finally(() => running.delete(key));

  running.set(key, task);
  return task;
}
