import type { Lang } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { DecisionBadge } from "@/frontend/components/match/decision-badge";
import { MatchPanel } from "@/frontend/components/match/match-panel";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { listDecided } from "@/backend/match/decision";
import { getMatchResults } from "@/backend/match/service";
import { formatDate } from "@/backend/format-date";

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { company, locale } = await requireCompanyPage();
  const t = await getTranslations("Matches");
  const tStatus = await getTranslations("Company.status");
  const { id } = await params;
  const { tab = "matches" } = await searchParams;

  // Faqat o'z talabi: boshqa kompaniyaniki "topilmadi".
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
  });
  if (!vacancy) notFound();

  // Tasdiqlanmagan kompaniya natijalarni ko'rmaydi (API ham 403 qaytaradi).
  const access = companyAccess(company);
  const [initial, decided, applications, stages] = access.canViewCvs
    ? await Promise.all([
        getMatchResults(company, vacancy, locale as Lang),
        listDecided(vacancy.id),
        db.vacancyApplication.findMany({
          where: { vacancyId: vacancy.id },
          include: {
            student: { select: { id: true, email: true } },
            cv: { select: { id: true, title: true, savedAt: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.candidateStage.findMany({
          where: { vacancyId: vacancy.id },
        }),
      ])
    : [null, [], [], []];

  const stageMap = new Map(stages.map((s) => [s.cvId, s.stage]));

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 space-y-3">
            <Link
              href="/company/vacancies"
              className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-colors"
            >
              <ArrowLeftIcon size={14} />
              {t("back")}
            </Link>
            <h1 className="text-h2 text-text font-extrabold tracking-tight break-words">
              {t("title", { title: vacancy.title })}
            </h1>
          </div>
        </div>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={75}>
        <div className="border-line bg-card/70 inline-flex rounded-2xl border p-1.5 backdrop-blur-md">
          <Link
            href={`/company/vacancies/${vacancy.id}/matches?tab=matches`}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === "matches"
                ? "bg-primary text-on-primary shadow-primary"
                : "text-subtle hover:text-text"
            }`}
          >
            {t("tabs.matches")}
          </Link>
          <Link
            href={`/company/vacancies/${vacancy.id}/matches?tab=applications`}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tab === "applications"
                ? "bg-primary text-on-primary shadow-primary"
                : "text-subtle hover:text-text"
            }`}
          >
            {t("tabs.applications", { count: applications.length })}
          </Link>
        </div>
      </Reveal>

      {tab === "applications" ? (
        <Reveal delay={150}>
          <section className="space-y-4">
            {applications.length === 0 ? (
              <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-md">
                <p className="text-subtle text-sm">{t("applicationsEmpty")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {applications.map((app) => (
                  <li
                    key={app.id}
                    className="border-line bg-card/90 shadow-soft flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-5 backdrop-blur-md transition-all hover:shadow-md"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-text text-base font-extrabold">
                          {app.cv.title}
                        </span>
                        {stageMap.has(app.cvId) && (
                          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                            {stageMap.get(app.cvId)}
                          </span>
                        )}
                      </div>
                      <p className="text-subtle text-xs">
                        {t("appliedAt", { date: formatDate(app.createdAt) })}
                      </p>
                    </div>

                    <Link
                      href={`/company/vacancies/${vacancy.id}/candidates/${app.cvId}`}
                      className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
                    >
                      {t("viewApplication")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      ) : (
        <Reveal delay={150}>
          <div className="space-y-6">
            {initial ? (
              <MatchPanel vacancyId={vacancy.id} initial={initial} />
            ) : (
              <FormAlert>
                {tStatus(
                  company.approval === "REJECTED" ? "REJECTED" : "PENDING",
                )}
              </FormAlert>
            )}
            {decided.length > 0 ? (
              <section className="border-line bg-card/90 shadow-soft space-y-3 rounded-3xl border p-6 backdrop-blur-md">
                <h2 className="text-text text-lg font-extrabold">
                  {t("decided")}
                </h2>
                <ul className="space-y-2.5">
                  {decided.map((item) => (
                    <li
                      key={item.cvId}
                      className="border-line bg-canvas/70 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5 text-sm"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <DecisionBadge decision={item.decision} />
                        <span className="text-text min-w-0 break-words">
                          {[item.skills.slice(0, 5).join(", "), item.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span className="text-subtle text-xs">
                          {formatDate(item.updatedAt)}
                        </span>
                      </div>
                      <Link
                        href={`/company/vacancies/${vacancy.id}/candidates/${item.cvId}`}
                        className="text-primary font-bold hover:underline"
                      >
                        {t("openCv")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </Reveal>
      )}
    </div>
  );
}
