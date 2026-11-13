import { getTranslations } from "next-intl/server";
import { Pagination } from "@/frontend/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireCompanyPage } from "@/backend/company/page";
import { formatDate } from "@/backend/format-date";
import { pageSchema } from "@/backend/vacancy/schema";
import { listVacancies } from "@/backend/vacancy/service";
import { db } from "@/backend/db";
import { decisionCounts } from "@/backend/match/decision";

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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/company/vacancies/new"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold"
        >
          {t("list.new")}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">{t("list.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((vacancy) => {
            const details = [
              vacancy.location,
              vacancy.workType ? tWork(vacancy.workType) : null,
              vacancy.minExperienceYears === null
                ? null
                : t("list.experience", { years: vacancy.minExperienceYears }),
            ].filter(Boolean);
            return (
              <li
                key={vacancy.id}
                className="border-border bg-surface space-y-2 rounded-2xl border p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 font-semibold break-words">
                    {vacancy.title}
                  </h2>
                  <span className="text-muted shrink-0 text-xs">
                    {t("list.created", { date: formatDate(vacancy.createdAt) })}
                  </span>
                </div>
                {counts.has(vacancy.id) ? (
                  <p className="text-sm">
                    {t("list.decisions", {
                      selected: counts.get(vacancy.id)!.selected,
                      rejected: counts.get(vacancy.id)!.rejected,
                    })}
                  </p>
                ) : null}
                {details.length > 0 ? (
                  <p className="text-muted text-sm">{details.join(" · ")}</p>
                ) : null}
                {vacancy.skills.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {vacancy.skills.map((skill) => (
                      <li
                        key={skill}
                        className="bg-brand-soft rounded px-2 py-0.5 text-xs"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {vacancy.rawText ? (
                  <p className="text-muted line-clamp-2 text-sm whitespace-pre-line">
                    {vacancy.rawText}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm font-medium">
                  <Link
                    href={`/company/vacancies/${vacancy.id}/matches?tab=applications`}
                    className="bg-brand-soft text-brand rounded-lg px-2.5 py-1 text-xs font-semibold hover:underline"
                  >
                    {t("list.applicationsCount", {
                      count: appCounts.get(vacancy.id) ?? 0,
                    })}
                  </Link>
                  <Link
                    href={`/company/vacancies/${vacancy.id}/matches`}
                    className="text-brand hover:underline"
                  >
                    {t("list.candidates")}
                  </Link>
                  <Link
                    href={`/company/vacancies/${vacancy.id}`}
                    className="text-brand hover:underline"
                  >
                    {t("list.edit")}
                  </Link>
                  <Link
                    href={{
                      pathname: "/company/vacancies/new",
                      query: { from: vacancy.id },
                    }}
                    className="text-brand hover:underline"
                  >
                    {t("list.copy")}
                  </Link>
                </div>
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
