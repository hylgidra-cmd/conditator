import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AssistantChat } from "@/components/dashboard/assistant-chat";
import { parseState, StateSwitcher } from "@/components/dashboard/page-state";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader } from "@/components/dashboard/ui";
import { routing } from "@/i18n/routing";
import { isRole } from "@/lib/dashboard/mock";

type Props = {
  params: Promise<{ locale: string; role: string }>;
  searchParams: Promise<{ state?: string }>;
};

export default async function AssistantPage({ params, searchParams }: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale) || !isRole(role)) notFound();
  setRequestLocale(locale);
  // Chat har doim salomlashuvdan boshlanadi: “boʻsh” holat shu. Yuklanishni koʻrsatish mumkin.
  const state = parseState((await searchParams).state);
  const t = await getTranslations("Dashboard");

  return (
    <>
      {state === "loading" ? (
        <DashboardSkeleton variant="chat" label={t("loading")} />
      ) : (
        <>
          <PageHeader
            title={t("assistant.title")}
            lead={t(`assistant.lead.${role}`)}
          />
          {/* key: rol almashganda suhbat yangidan boshlanadi. */}
          <AssistantChat key={role} role={role} />
        </>
      )}
      <StateSwitcher
        href={`/dashboard/${role}/assistant`}
        current={state}
        states={["filled", "loading"]}
      />
    </>
  );
}
