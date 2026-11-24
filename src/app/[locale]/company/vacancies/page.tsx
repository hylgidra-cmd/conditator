import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("vacancies") };
}
import { Reveal } from "@/frontend/components/ds/motion";
import { PlusIcon } from "@/frontend/components/icons";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireCompanyPage } from "@/backend/company/page";
import { formatDate } from "@/backend/format-date";
import { pageSchema } from "@/backend/vacancy/schema";
import { listVacancies } from "@/backend/vacancy/service";
import { db } from "@/backend/db";
import { decisionCounts } from "@/backend/match/decision";

const REVEAL_DELAYS = [0, 75, 150, 225] as const;

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Vacancies");
  const tWork = await getTranslations("StudentCv.workTypes");
  const page = pageSchema.parse((await searchParams).page);
  const { items, pageCount } = await listVacancies(company.id, page);
  const ids = items.map((item) => item.id);
  const [counts, appRows] = await Promise.all([
    decisionCounts(ids),
    ids.length > 0
      ? db.vacancyApplication.groupBy({
          by: ["vacancyId"],
          where: { vacancyId: { in: ids } },
          _count: { _all: true },
        })
      : [],
  ]);
  const appCounts = new Map(appRows.map((r) => [r.vacancyId, r._count._all]));

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 backdrop-blur-xl sm:p-7">
          <h1 className="text-h2 text-text font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <Link
            href="/company/vacancies/new"
            className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
          >
            <PlusIcon size={15} />
            {t("list.new")}
          </Link>
        </div>
      </Reveal>

      {items.length === 0 ? (
        <Reveal>
          <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
            <p className="text-subtle text-sm font-medium">{t("list.empty")}</p>
          </div>
        </Reveal>
      ) : (
        <ul className="space-y-3.5">
          {items.map((vacancy, idx) => {
            const salaryLabel =
              vacancy.salaryFrom || vacancy.salaryTo
                ? [
                    vacancy.salaryFrom
                      ? vacancy.salaryFrom.toLocaleString("en-US")
                      : "",
                    vacancy.salaryTo
                      ? `– ${vacancy.salaryTo.toLocaleString("en-US")}`
                      : "",
                    vacancy.currency,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : null;
            const statusText = t(`list.status.${vacancy.status}`);
            const statusClass =
              vacancy.status === "ACTIVE"
                ? "border-emerald-500/30 bg-success-soft text-success"
                : vacancy.status === "CLOSED"
                  ? "border-line bg-card-cool text-subtle"
                  : "border-red-500/30 bg-danger-soft text-danger";
            const details = [
              salaryLabel,
              vacancy.location,
              vacancy.workType ? tWork(vacancy.workType) : null,
              vacancy.minExperienceYears === null
                ? null
                : t("list.experience", { years: vacancy.minExperienceYears }),
            ].filter(Boolean);
            return (
              <li key={vacancy.id}>
                <Reveal delay={REVEAL_DELAYS[idx % 4]}>
                  <div className="border-line bg-card/90 shadow-soft hover:shadow-float hover:border-primary/40 space-y-3 rounded-3xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="text-text min-w-0 text-lg font-extrabold break-words">
                          {vacancy.title}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusClass}`}
                        >
                          {statusText}
                        </span>
                      </div>
                      <span className="text-subtle shrink-0 text-xs font-medium">
                        {t("list.created", {
                          date: formatDate(vacancy.createdAt),
                        })}
                      </span>
                    </div>
                    {counts.has(vacancy.id) ? (
                      <p className="text-text text-sm font-medium">
                        {t("list.decisions", {
                          selected: counts.get(vacancy.id)!.selected,
                          rejected: counts.get(vacancy.id)!.rejected,
                        })}
                      </p>
                    ) : null}
                    {details.length > 0 ? (
                      <p className="text-subtle text-sm">
                        {details.join(" · ")}
                      </p>
                    ) : null}
                    {vacancy.skills.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {vacancy.skills.map((skill) => (
                          <li
                            key={skill}
                            className="border-line bg-card-cool text-text rounded-lg border px-2.5 py-0.5 text-xs font-semibold"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {vacancy.rawText ? (
                      <p className="text-subtle line-clamp-2 text-sm whitespace-pre-line">
                        {vacancy.rawText}
                      </p>
                    ) : null}
                    <div className="border-line/70 flex flex-wrap items-center gap-3 border-t pt-3 text-sm font-semibold">
                      <Link
                        href={`/company/vacancies/${vacancy.id}/matches?tab=applications`}
                        className="bg-primary-soft text-primary-text rounded-xl px-3 py-1 text-xs font-bold hover:underline"
                      >
                        {t("list.applicationsCount", {
                          count: appCounts.get(vacancy.id) ?? 0,
                        })}
                      </Link>
                      <Link
                        href={`/company/vacancies/${vacancy.id}/matches`}
                        className="text-primary-text text-xs font-bold hover:underline"
                      >
                        {t("list.candidates")}
                      </Link>
                      <Link
                        href={`/company/vacancies/${vacancy.id}`}
                        className="text-text hover:text-primary-text text-xs font-bold hover:underline"
                      >
                        {t("list.edit")}
                      </Link>
                      <Link
                        href={{
                          pathname: "/company/vacancies/new",
                          query: { from: vacancy.id },
                        }}
                        className="text-subtle hover:text-text text-xs font-bold hover:underline"
                      >
                        {t("list.copy")}
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        pathname="/company/vacancies"
      />
    </div>
  );
}
