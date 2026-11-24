import "server-only";
import { randomInt } from "node:crypto";
import type {
  PersonalityQuestion,
  PersonalityResult,
  PersonalityScale,
} from "@prisma/client";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import {
  buildScaleBars,
  getGroupName,
  getGroupSummary,
  getLocaleKey,
  PERSONALITY_TYPE_BY_CODE,
  STATEMENT_OPTIONS,
  type LocaleKey,
} from "./catalog";
import {
  personalityGroup,
  resolveAnswerNumericValue,
  scorePersonality,
  type RawAnswerValue,
} from "./score";

export const QUESTION_VERSION = 1;
const SCALES: readonly PersonalityScale[] = [
  "MIND",
  "ENERGY",
  "NATURE",
  "TACTICS",
  "IDENTITY",
];

export type PublicPersonalityProfile = {
  id: string;
  createdAt: string;
  typeName: string;
  groupCode: "NT" | "NF" | "SJ" | "SP";
  groupName: string;
  groupSummary: string;
  strengths: string;
  description: string;
  mindPct: number;
  energyPct: number;
  naturePct: number;
  tacticsPct: number;
  identityPct: number;
  scales: ReturnType<typeof buildScaleBars>;
  /** Faqat admin API sida qaytariladi; talaba va HR ko'rmaydi. */
  typeCode?: string;
  identity?: string;
};

export type ClientQuestionItem = {
  id: string;
  type: "STATEMENT" | "CHOICE";
  text: string;
  options: Array<{ key: string; label: string }>;
};

export async function retakeDays(): Promise<number> {
  const row = await db.setting.findUnique({
    where: { key: "personalityRetakeDays" },
  });
  const value = Number(row?.value ?? 30);
  return Number.isInteger(value) && value >= 1 && value <= 365 ? value : 30;
}

export async function questionsPerTest(): Promise<number> {
  const row = await db.setting.findUnique({
    where: { key: "personalityQuestionsPerTest" },
  });
  const raw = Number(row?.value ?? 20);
  if (!Number.isFinite(raw)) return 20;
  // 10–20 oralig'ida va 5 ga bo'linadigan son (10, 15, 20) — 5 shkaladan teng olish uchun
  const clamped = Math.max(10, Math.min(20, Math.round(raw / 5) * 5));
  return clamped;
}

export async function personalityMatchWeightPct(): Promise<number> {
  const row = await db.setting.findUnique({
    where: { key: "personalityMatchWeightPct" },
  });
  const raw = Number(row?.value ?? 10);
  return Number.isInteger(raw) && raw >= 0 && raw <= 20 ? raw : 10;
}

export async function activeResult(userId: string) {
  return db.personalityResult.findFirst({
    where: { userId, archivedAt: null, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

function localizedQuestionText(q: PersonalityQuestion, locale: LocaleKey) {
  if (locale === "kk") return q.textKk;
  if (locale === "ru") return q.textRu;
  if (locale === "en") return q.textEn;
  return q.textUz;
}

function localizedOption(
  q: PersonalityQuestion,
  side: "A" | "B",
  locale: LocaleKey,
) {
  if (side === "A") {
    if (locale === "kk") return q.optionAKk ?? q.optionAUz ?? "A";
    if (locale === "ru") return q.optionARu ?? q.optionAUz ?? "A";
    if (locale === "en") return q.optionAEn ?? q.optionAUz ?? "A";
    return q.optionAUz ?? "A";
  }
  if (locale === "kk") return q.optionBKk ?? q.optionBUz ?? "B";
  if (locale === "ru") return q.optionBRu ?? q.optionBUz ?? "B";
  if (locale === "en") return q.optionBEn ?? q.optionBUz ?? "B";
  return q.optionBUz ?? "B";
}

export function formatClientQuestion(
  q: PersonalityQuestion,
  locale: LocaleKey,
): ClientQuestionItem {
  if (q.type === "CHOICE") {
    return {
      id: q.id,
      type: "CHOICE",
      text: localizedQuestionText(q, locale),
      options: [
        { key: "A", label: localizedOption(q, "A", locale) },
        { key: "B", label: localizedOption(q, "B", locale) },
      ],
    };
  }
  return {
    id: q.id,
    type: "STATEMENT",
    text: localizedQuestionText(q, locale),
    options: STATEMENT_OPTIONS.map((opt) => ({
      key: opt.key,
      label: opt.label[locale],
    })),
  };
}

function shuffleCrypto<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Backend TZ 2, 3-bo'lim qoidasi bilan 20 (yoki admin sozlagan 10..20) savol tanlaydi:
 * 1. Har 5 shkaladan teng son (standart 4 tadan).
 * 2. Har shkalada yarmi +1, yarmi -1 tomonga yozilgan savol.
 * 3. Har shkalada kamida 1 ta "Tanlov" (CHOICE) savoli (bankda mavjud bo'lsa).
 * 4. Avvalgi urinishlarda ko'rilmagan savollar birinchi olinadi; 4-urinishdan eng eski ko'rilganlar qaytadi.
 * 5. Yakuniy tartib tasodifiy aralashtiriladi.
 */
async function selectQuestionsForUser(
  userId: string,
  totalCount: number,
): Promise<PersonalityQuestion[]> {
  const perScale = Math.floor(totalCount / 5);
  const [bank, prevAttempts, prevAnswers] = await Promise.all([
    db.personalityQuestion.findMany({
      where: { isActive: true, version: QUESTION_VERSION },
      orderBy: { sort: "asc" },
    }),
    db.personalityAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "asc" },
      select: { questionIds: true, startedAt: true },
    }),
    db.personalityAnswer.findMany({
      where: { result: { userId } },
      select: { questionId: true, result: { select: { createdAt: true } } },
    }),
  ]);

  // Har bir savol oxirgi marta qachon ko'rilgan (0 = hech qachon ko'rilmagan)
  const lastSeenAt = new Map<string, number>();
  for (const ans of prevAnswers) {
    const ts = ans.result.createdAt.getTime();
    const cur = lastSeenAt.get(ans.questionId) ?? 0;
    if (ts > cur) lastSeenAt.set(ans.questionId, ts);
  }
  for (const attempt of prevAttempts) {
    const ts = attempt.startedAt.getTime();
    for (const qid of attempt.questionIds) {
      const cur = lastSeenAt.get(qid) ?? 0;
      if (ts > cur) lastSeenAt.set(qid, ts);
    }
  }

  // Bir xil "ko'rilgan vaqt" guruhida tasodifiy tartib berish
  function pickFromPool(
    pool: PersonalityQuestion[],
    need: number,
    preferChoiceFirst: boolean,
  ): PersonalityQuestion[] {
    if (need <= 0 || pool.length === 0) return [];
    const randomized = shuffleCrypto(pool);
    // Eng kam/eski ko'rilganlar oldinda (0 = hech qachon ko'rilmagan)
    randomized.sort((a, b) => {
      const seenDiff = (lastSeenAt.get(a.id) ?? 0) - (lastSeenAt.get(b.id) ?? 0);
      if (seenDiff !== 0) return seenDiff;
      if (preferChoiceFirst && a.type !== b.type) {
        return a.type === "CHOICE" ? -1 : 1;
      }
      return 0;
    });
    return randomized.slice(0, need);
  }

  const chosen: PersonalityQuestion[] = [];
  for (const scale of SCALES) {
    const scalePool = bank.filter((q) => q.scale === scale);
    const posPool = scalePool.filter((q) => q.direction === 1);
    const negPool = scalePool.filter((q) => q.direction === -1);

    const posNeed = Math.floor(perScale / 2);
    const negNeed = perScale - posNeed;

    // Har shkalada kamida 1 ta CHOICE savoli bo'lishini kafolatlash
    const choiceSide = randomInt(0, 2) === 0 ? 1 : -1;
    const pickedPos = pickFromPool(posPool, posNeed, choiceSide === 1);
    const pickedNeg = pickFromPool(negPool, negNeed, choiceSide === -1);

    let scaleChosen = [...pickedPos, ...pickedNeg];

    // Agar tanlanganlarda CHOICE tushmagan bo'lsa, lekin bankda bor bo'lsa, bittasini almashtiramiz
    if (!scaleChosen.some((q) => q.type === "CHOICE")) {
      const choiceCandidates = pickFromPool(
        scalePool.filter((q) => q.type === "CHOICE"),
        1,
        true,
      );
      if (choiceCandidates.length === 1) {
        const replacement = choiceCandidates[0];
        const replaceIdx = scaleChosen.findIndex(
          (q) => q.direction === replacement.direction,
        );
        if (replaceIdx >= 0) {
          scaleChosen[replaceIdx] = replacement;
        }
      }
    }

    // Agar bankda biror tomonda yetishmovchilik bo'lsa, qolganidan to'ldiramiz
    if (scaleChosen.length < perScale) {
      const chosenIds = new Set(scaleChosen.map((q) => q.id));
      const extras = pickFromPool(
        scalePool.filter((q) => !chosenIds.has(q.id)),
        perScale - scaleChosen.length,
        false,
      );
      scaleChosen = [...scaleChosen, ...extras];
    }

    if (scaleChosen.length !== perScale) {
      throw new ApiError(503, "SERVER_ERROR");
    }
    chosen.push(...scaleChosen);
  }

  return shuffleCrypto(chosen);
}

export async function formatPublicPersonalityResult(
  result: PersonalityResult,
  localeInput?: string | null,
  options?: { includeAdminCode?: boolean },
): Promise<PublicPersonalityProfile> {
  const locale = getLocaleKey(localeInput);
  const groupCode = personalityGroup(result.typeCode);
  const dbType = await db.personalityType.findUnique({
    where: { code: result.typeCode },
  });
  const fallback = PERSONALITY_TYPE_BY_CODE.get(result.typeCode);

  const typeName = dbType
    ? locale === "kk"
      ? dbType.titleKk
      : locale === "ru"
        ? dbType.titleRu
        : locale === "en"
          ? dbType.titleEn
          : dbType.titleUz
    : (fallback?.title[locale] ?? result.typeCode);

  const strengths = dbType
    ? (locale === "kk"
        ? dbType.strengthsKk
        : locale === "ru"
          ? dbType.strengthsRu
          : locale === "en"
            ? dbType.strengthsEn
            : dbType.strengthsUz) || (fallback?.strengths[locale] ?? "")
    : (fallback?.strengths[locale] ?? "");

  const description = dbType
    ? locale === "kk"
      ? dbType.descriptionKk
      : locale === "ru"
        ? dbType.descriptionRu
        : locale === "en"
          ? dbType.descriptionEn
          : dbType.descriptionUz
    : (fallback?.description[locale] ?? "");

  return {
    id: result.id,
    createdAt: result.createdAt.toISOString(),
    typeName,
    groupCode,
    groupName: getGroupName(groupCode, locale),
    groupSummary: getGroupSummary(groupCode, locale),
    strengths,
    description,
    mindPct: result.mindPct,
    energyPct: result.energyPct,
    naturePct: result.naturePct,
    tacticsPct: result.tacticsPct,
    identityPct: result.identityPct,
    scales: buildScaleBars(result, locale),
    ...(options?.includeAdminCode
      ? { typeCode: result.typeCode, identity: result.identity }
      : {}),
  };
}

export async function getActivePersonalityProfile(
  userId: string,
  localeInput?: string | null,
  options?: { includeAdminCode?: boolean },
): Promise<PublicPersonalityProfile | null> {
  const result = await activeResult(userId);
  if (!result) return null;
  return formatPublicPersonalityResult(result, localeInput, options);
}

export async function getActiveAttempt(
  userId: string,
  localeInput?: string | null,
) {
  const locale = getLocaleKey(localeInput);
  const attempt = await db.personalityAttempt.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (!attempt) return null;
  const questions = await db.personalityQuestion.findMany({
    where: { id: { in: attempt.questionIds } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = attempt.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is PersonalityQuestion => Boolean(q));

  if (ordered.length !== attempt.questionIds.length) {
    return null;
  }
  const answers =
    attempt.answers && typeof attempt.answers === "object"
      ? (attempt.answers as Record<string, string>)
      : {};
  return {
    id: attempt.id,
    startedAt: attempt.startedAt.toISOString(),
    totalQuestions: ordered.length,
    questions: ordered.map((q) => formatClientQuestion(q, locale)),
    answers,
  };
}

export async function startOrResumeAttempt(
  userId: string,
  localeInput?: string | null,
) {
  const locale = getLocaleKey(localeInput);
  const existing = await getActiveAttempt(userId, locale);
  if (existing) return existing;

  const previous = await activeResult(userId);
  const cooldownDays = await retakeDays();
  if (
    previous &&
    Date.now() - previous.createdAt.getTime() < cooldownDays * 86400000
  ) {
    throw new ApiError(409, "VALIDATION");
  }

  const count = await questionsPerTest();
  const selected = await selectQuestionsForUser(userId, count);
  const attempt = await db.personalityAttempt.create({
    data: {
      userId,
      questionIds: selected.map((q) => q.id),
      answers: {},
      status: "IN_PROGRESS",
    },
  });

  return {
    id: attempt.id,
    startedAt: attempt.startedAt.toISOString(),
    totalQuestions: selected.length,
    questions: selected.map((q) => formatClientQuestion(q, locale)),
    answers: {} as Record<string, string>,
  };
}

export async function saveAttemptAnswers(
  userId: string,
  attemptId: string,
  patch: Record<string, RawAnswerValue>,
) {
  const attempt = await db.personalityAttempt.findFirst({
    where: { id: attemptId, userId, status: "IN_PROGRESS" },
  });
  if (!attempt) throw new ApiError(404, "NOT_FOUND");

  const allowedIds = new Set(attempt.questionIds);
  const patchKeys = Object.keys(patch);
  if (patchKeys.some((id) => !allowedIds.has(id))) {
    throw new ApiError(400, "VALIDATION");
  }

  const questions = await db.personalityQuestion.findMany({
    where: { id: { in: patchKeys } },
    select: { id: true, type: true },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const current =
    attempt.answers && typeof attempt.answers === "object"
      ? { ...(attempt.answers as Record<string, string>) }
      : {};

  for (const [qid, rawVal] of Object.entries(patch)) {
    const q = byId.get(qid);
    if (!q) throw new ApiError(400, "VALIDATION");
    try {
      const normalized = resolveAnswerNumericValue(q.type, rawVal);
      if (q.type === "CHOICE") {
        current[qid] = normalized.choice!;
      } else {
        const opt = STATEMENT_OPTIONS.find((o) => o.value === normalized.value);
        current[qid] = opt ? opt.key : "neutral";
      }
    } catch {
      throw new ApiError(400, "VALIDATION");
    }
  }

  await db.personalityAttempt.update({
    where: { id: attempt.id },
    data: { answers: current },
  });

  return {
    id: attempt.id,
    answeredCount: Object.keys(current).length,
    totalQuestions: attempt.questionIds.length,
  };
}

export async function finishAttempt(
  userId: string,
  attemptId: string,
  consent: boolean,
  localeInput?: string | null,
) {
  if (!consent) throw new ApiError(400, "VALIDATION");
  const attempt = await db.personalityAttempt.findFirst({
    where: { id: attemptId, userId, status: "IN_PROGRESS" },
  });
  if (!attempt) throw new ApiError(404, "NOT_FOUND");

  const storedAnswers =
    attempt.answers && typeof attempt.answers === "object"
      ? (attempt.answers as Record<string, RawAnswerValue>)
      : {};

  if (attempt.questionIds.some((id) => storedAnswers[id] === undefined)) {
    throw new ApiError(400, "VALIDATION");
  }

  const questions = await db.personalityQuestion.findMany({
    where: { id: { in: attempt.questionIds } },
  });
  if (questions.length !== attempt.questionIds.length) {
    throw new ApiError(503, "SERVER_ERROR");
  }

  let score;
  try {
    score = scorePersonality(questions, storedAnswers);
  } catch {
    throw new ApiError(400, "VALIDATION");
  }

  const now = new Date();
  const created = await db.$transaction(async (tx) => {
    await tx.personalityResult.updateMany({
      where: { userId, archivedAt: null },
      data: { archivedAt: now },
    });
    const res = await tx.personalityResult.create({
      data: {
        userId,
        attemptId: attempt.id,
        ...score,
        version: QUESTION_VERSION,
        consentAt: now,
        answers: {
          create: questions.map((q) => {
            const norm = resolveAnswerNumericValue(q.type, storedAnswers[q.id]);
            return {
              questionId: q.id,
              attemptId: attempt.id,
              value: norm.value,
              choice: norm.choice,
            };
          }),
        },
      },
    });
    await tx.personalityAttempt.update({
      where: { id: attempt.id },
      data: { status: "COMPLETED", finishedAt: now },
    });
    await tx.personalityDraft.deleteMany({ where: { userId } });
    return res;
  });

  return formatPublicPersonalityResult(created, localeInput);
}

/** Legacy compatibility helper for older tests/callers if needed. */
export async function personalityQuestions() {
  return db.personalityQuestion.findMany({
    where: { isActive: true, version: QUESTION_VERSION },
    orderBy: { sort: "asc" },
  });
}
