import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  finishAttempt,
  saveAttemptAnswers,
  startOrResumeAttempt,
} from "@/backend/personality/service";
import { rebuildReadiness } from "@/backend/readiness/service";

const schema = z.object({
  attemptId: z.string().min(1).optional(),
  answers: z
    .record(
      z.string(),
      z.union([z.string().min(1).max(40), z.number().int().min(-2).max(2)]),
    )
    .optional(),
  consent: z.literal(true),
  locale: z.enum(["uz", "kk", "ru", "en"]).optional(),
});

export const POST = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const { attemptId, answers, consent, locale } = await parseJson(
    request,
    schema,
  );
  const lang = locale ?? user.locale;
  const activeId = attemptId ?? (await startOrResumeAttempt(user.id, lang)).id;
  if (answers && Object.keys(answers).length > 0) {
    await saveAttemptAnswers(user.id, activeId, answers);
  }
  const result = await finishAttempt(user.id, activeId, consent, lang);
  await rebuildReadiness(user.id);
  return NextResponse.json({ result }, { status: 201 });
});
