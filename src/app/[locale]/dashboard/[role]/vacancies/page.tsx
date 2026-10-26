import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonClass } from "@/components/ds/button";
import { cn } from "@/components/ds/cn";
import { parseState, StateSwitcher } from "@/components/dashboard/page-state";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";
import { EmptyState, PageHeader, PANEL } from "@/components/dashboard/ui";
import { VacancyTable } from "@/components/dashboard/vacancy-table";
import { BriefcaseIcon, PlusIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isRole, VACANCIES } from "@/lib/dashboard/mock";

type Props = {
  params: Promise<{ locale: string; role: string }>;
  searchParams: Promise<{ state?: string; q?: string }>;
};

export default async function VacanciesPage({ params, searchParams }: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale) || !isRole(role)) notFound();
  setRequestLocale(locale);
  const { state: rawState, q } = await searchParams;
  const state = parseState(rawState);
  const t = await getTranslations("Dashboard");
  const href = `/dashboard/${role}/vacancies`;

  const createLink =
    role === "employer" ? (
      <Link
        href="/company/vacancies/new"
        className={buttonClass({ className: "gap-2" })}
      >
        <PlusIcon size={18} />
        {t("vacancies.create")}
      </Link>
    ) : null;

  return (
    <>
      {state === "loading" ? (
        <DashboardSkeleton variant="table" label={t("loading")} />
      ) : (
        <>
          <PageHeader
            title={t(`vacancies.title.${role}`)}
            lead={t(`vacancies.lead.${role}`)}
            actions={createLink}
          />
          {state === "empty" ? (
            <div className={cn(PANEL)}>
              <EmptyState
                icon={<BriefcaseIcon size={24} />}
                title={t(`empty.vacancies.${role}.title`)}
                text={t(`empty.vacancies.${role}.text`)}
                action={
                  role === "candidate"
                    ? { href: "/student/cv", label: t("overview.progressCta") }
                    : {
                        href: "/company/vacancies/new",
                        label: t("vacancies.create"),
                      }
                }
              />
            </div>
          ) : (
            <VacancyTable
              role={role}
              vacancies={VACANCIES}
              initialQuery={typeof q === "string" ? q.slice(0, 80) : ""}
            />
          )}
        </>
      )}
      <StateSwitcher href={href} current={state} />
    </>
  );
}
