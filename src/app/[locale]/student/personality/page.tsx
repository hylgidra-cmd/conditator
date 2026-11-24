import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import {
  getActiveAttempt,
  getActivePersonalityProfile,
  questionsPerTest,
  retakeDays,
} from "@/backend/personality/service";
import { PersonalityTest } from "@/frontend/components/personality/personality-test";

export default async function PersonalityPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });
  const lang =
    locale === "kk" || locale === "ru" || locale === "en" ? locale : "uz";

  const [attempt, result, days, count] = await Promise.all([
    getActiveAttempt(user.id, lang),
    getActivePersonalityProfile(user.id, lang),
    retakeDays(),
    questionsPerTest(),
  ]);

  return (
    <PersonalityTest
      locale={lang}
      initialAttempt={attempt}
      initialResult={result}
      retakeDays={days}
      questionsPerTest={count}
    />
  );
}
