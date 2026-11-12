import type { Lang } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <Link
          href="/company/vacancies"
          className="text-brand text-sm font-medium hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="text-2xl font-bold break-words">
          {t("title", { title: vacancy.title })}
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-border flex border-b">
        <Link
          href={`/company/vacancies/${vacancy.id}/matches?tab=matches`}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
            tab === "matches"
              ? "border-brand text-brand"
              : "text-muted hover:text-foreground border-transparent"
          }`}
        >
          {t("tabs.matches")}
        </Link>
        <Link
          href={`/company/vacancies/${vacancy.id}/matches?tab=applications`}
          className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
            tab === "applications"
              ? "border-brand text-brand"
              : "text-muted hover:text-foreground border-transparent"
          }`}
        >
          {t("tabs.applications", { count: applications.length })}
        </Link>
      </div>

      {tab === "applications" ? (
        <section className="space-y-4">
          {applications.length === 0 ? (
            <div className="border-border bg-surface rounded-2xl border p-12 text-center">
              <p className="text-muted text-sm">{t("applicationsEmpty")}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">
                        {app.cv.title}
                      </span>
                      {stageMap.has(app.cvId) && (
                        <span className="bg-brand-soft text-brand rounded px-2 py-0.5 text-xs font-semibold">
                          {stageMap.get(app.cvId)}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs">
                      {t("appliedAt", { date: formatDate(app.createdAt) })}
                    </p>
                  </div>

                  <Link
                    href={`/company/vacancies/${vacancy.id}/candidates/${app.cvId}`}
                    className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-xs font-bold shadow transition-opacity hover:opacity-95"
                  >
                    {t("viewApplication")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
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
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">{t("decided")}</h2>
              <ul className="space-y-2">
                {decided.map((item) => (
                  <li
                    key={item.cvId}
                    className="border-border bg-surface flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <DecisionBadge decision={item.decision} />
                      <span className="min-w-0 break-words">
                        {[item.skills.slice(0, 5).join(", "), item.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="text-muted text-xs">
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                    <Link
                      href={`/company/vacancies/${vacancy.id}/candidates/${item.cvId}`}
                      className="text-brand font-semibold hover:underline"
                    >
                      {t("openCv")}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
