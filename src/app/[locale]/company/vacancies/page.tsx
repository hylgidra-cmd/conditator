import { getTranslations } from "next-intl/server";
import { Pagination } from "@/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { requireCompanyPage } from "@/lib/company/page";
import { formatDate } from "@/lib/format-date";
import { pageSchema } from "@/lib/vacancy/schema";
import { listVacancies } from "@/lib/vacancy/service";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/company/vacancies/new"
          className="bg-brand rounded-lg px-4 py-2 font-semibold text-white"
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
                <div className="flex flex-wrap gap-3 pt-1 text-sm font-medium">
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
