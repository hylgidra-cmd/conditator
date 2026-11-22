import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import {
  activeResult,
  personalityQuestions,
  QUESTION_VERSION,
  retakeDays,
} from "@/backend/personality/service";
import { PersonalityTest } from "@/frontend/components/personality/personality-test";

export default async function PersonalityPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });
  const [questions, draft, result, days] = await Promise.all([
    personalityQuestions(),
    db.personalityDraft.findUnique({ where: { userId: user.id } }),
    activeResult(user.id),
    retakeDays(),
  ]);
  const lang =
    locale === "kk" || locale === "ru" || locale === "en" ? locale : "uz";
  // Stable per-student ordering keeps a saved draft's page positions unchanged.
  const ordered = [...questions].sort((a, b) => {
    const keyA = `${user.id}:${a.id}`;
    const keyB = `${user.id}:${b.id}`;
    let hashA = 0,
      hashB = 0;
    for (const char of keyA) hashA = (hashA * 31 + char.charCodeAt(0)) | 0;
    for (const char of keyB) hashB = (hashB * 31 + char.charCodeAt(0)) | 0;
    return hashA - hashB;
  });
  return (
    <PersonalityTest
      locale={lang}
      questions={ordered.map((q) => ({
        id: q.id,
        text:
          lang === "kk"
            ? q.textKk
            : lang === "ru"
              ? q.textRu
              : lang === "en"
                ? q.textEn
                : q.textUz,
      }))}
      initialAnswers={
        draft?.version === QUESTION_VERSION &&
        typeof draft.answers === "object" &&
        draft.answers !== null
          ? (draft.answers as Record<string, number>)
          : {}
      }
      initialResult={
        result
          ? {
              typeCode: result.typeCode,
              identity: result.identity,
              mindPct: result.mindPct,
              energyPct: result.energyPct,
              naturePct: result.naturePct,
              tacticsPct: result.tacticsPct,
              identityPct: result.identityPct,
              createdAt: result.createdAt.toISOString(),
            }
          : null
      }
      retakeDays={days}
    />
  );
}
