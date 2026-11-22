import "server-only";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { scorePersonality } from "./score";

export const QUESTION_VERSION = 1;

export async function retakeDays(): Promise<number> {
  const row = await db.setting.findUnique({
    where: { key: "personalityRetakeDays" },
  });
  const value = Number(row?.value ?? 30);
  return Number.isInteger(value) && value >= 1 && value <= 365 ? value : 30;
}

export async function activeResult(userId: string) {
  return db.personalityResult.findFirst({
    where: { userId, archivedAt: null, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function personalityQuestions() {
  const active = await db.personalityQuestion.findMany({
    where: { isActive: true, version: QUESTION_VERSION },
    orderBy: { sort: "asc" },
  });
  const questions = (
    ["MIND", "ENERGY", "NATURE", "TACTICS", "IDENTITY"] as const
  )
    .flatMap((scale) =>
      active.filter((question) => question.scale === scale).slice(0, 12),
    )
    .sort((a, b) => a.sort - b.sort);
  if (questions.length !== 60) throw new ApiError(503, "SERVER_ERROR");
  return questions;
}

export async function submitPersonality(
  userId: string,
  answers: Record<string, number>,
  consent: boolean,
) {
  if (!consent) throw new ApiError(400, "VALIDATION");
  const questions = await personalityQuestions();
  if (
    Object.keys(answers).length !== 60 ||
    questions.some((q) => !Object.hasOwn(answers, q.id))
  ) {
    throw new ApiError(400, "VALIDATION");
  }
  let score;
  try {
    score = scorePersonality(questions, answers);
  } catch {
    throw new ApiError(400, "VALIDATION");
  }
  const previous = await activeResult(userId);
  if (
    previous &&
    Date.now() - previous.createdAt.getTime() < (await retakeDays()) * 86400000
  ) {
    throw new ApiError(409, "VALIDATION");
  }
  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    await tx.personalityResult.updateMany({
      where: { userId, archivedAt: null },
      data: { archivedAt: now },
    });
    const created = await tx.personalityResult.create({
      data: {
        userId,
        ...score,
        version: QUESTION_VERSION,
        consentAt: now,
        answers: {
          create: questions.map((q) => ({
            questionId: q.id,
            value: answers[q.id],
          })),
        },
      },
    });
    await tx.personalityDraft.deleteMany({ where: { userId } });
    return created;
  });
  return result;
}
