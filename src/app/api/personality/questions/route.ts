import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import {
  personalityQuestions,
  QUESTION_VERSION,
} from "@/backend/personality/service";

export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const locale = user.locale;
  const questions = await personalityQuestions();
  const draft = await db.personalityDraft.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({
    version: QUESTION_VERSION,
    questions: questions.map((q) => ({
      id: q.id,
      text:
        locale === "kk"
          ? q.textKk
          : locale === "ru"
            ? q.textRu
            : locale === "en"
              ? q.textEn
              : q.textUz,
    })),
    answers: draft?.version === QUESTION_VERSION ? draft.answers : {},
  });
});
