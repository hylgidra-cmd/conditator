import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  personalityQuestions,
  QUESTION_VERSION,
} from "@/backend/personality/service";

const schema = z.object({
  answers: z.record(z.string(), z.number().int().min(-3).max(3)),
});

export const PUT = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const { answers } = await parseJson(request, schema);
  const questions = await personalityQuestions();
  const ids = new Set(questions.map((q) => q.id));
  if (
    Object.keys(answers).length > 60 ||
    Object.keys(answers).some((id) => !ids.has(id))
  ) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }
  await db.personalityDraft.upsert({
    where: { userId: user.id },
    create: { userId: user.id, answers, version: QUESTION_VERSION },
    update: { answers, version: QUESTION_VERSION },
  });
  return NextResponse.json({ ok: true });
});
