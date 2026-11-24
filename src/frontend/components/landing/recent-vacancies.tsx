import { getTranslations } from "next-intl/server";
import type { FeaturedVacancy } from "@/backend/landing-stats";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  MapPinIcon,
} from "@/frontend/components/icons";
import { CompanyLogo } from "@/frontend/components/ui/company-logo";
import { BookmarkButton } from "@/frontend/components/vacancy/bookmark-button";
import { Link } from "@/i18n/navigation";
import styles from "./sections.module.css";
import { RetryVacanciesButton } from "./retry-vacancies-button";

type Props = {
  vacancies: FeaturedVacancy[];
  loadError: boolean;
  savedVacancyIds: string[];
  isAuthenticated: boolean;
};

function formatVacancySalary(v: FeaturedVacancy): string | null {
  if (!v.salaryFrom && !v.salaryTo) return null;
  const parts: string[] = [];
  if (v.salaryFrom) parts.push(v.salaryFrom.toLocaleString("en-US"));
  if (v.salaryTo) parts.push(`– ${v.salaryTo.toLocaleString("en-US")}`);
  parts.push(v.currency);
  return parts.join(" ");
}

/**
 * Section 2 — Recent Vacancies.
 * Shows strictly live published database records with zero fabricated employers, logos, or salaries,
 * balanced responsive grids across 1-4+ items, working bookmarks, and clean empty/error states.
 */
export async function RecentVacancies({
  vacancies,
  loadError,
  savedVacancyIds,
  isAuthenticated,
}: Props) {
  const [t, tWork] = await Promise.all([
    getTranslations("Landing.vacanciesSection"),
    getTranslations("StudentCv.workTypes"),
  ]);

  const savedSet = new Set(savedVacancyIds);
  const items = vacancies.slice(0, 4);

  const gridClass =
    items.length === 1
      ? "mx-auto grid max-w-xl grid-cols-1 gap-5"
      : items.length === 2
        ? "mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2"
        : items.length === 3
          ? "grid grid-cols-1 gap-5 md:grid-cols-3"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section
      id="recent-vacancies"
      aria-labelledby="recent-vacancies-heading"
      className={styles.vacanciesSection}
    >
      <div className={styles.sectionWrap}>
        <div className={styles.vacanciesHeader}>
          <h2 id="recent-vacancies-heading" className={styles.sectionHeading}>
            {t("title")}
          </h2>

          <Link
            href="/vacancies"
            className="border-line bg-card/90 text-text hover:border-primary/50 hover:text-primary-text inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-xs transition-all dark:border-emerald-400/32 dark:bg-[#081f17]/90 dark:text-white dark:hover:border-emerald-300/65 dark:hover:text-[#6ee7b7]"
          >
            <span>{t("viewAll")}</span>
            <ArrowRightIcon size={14} />
          </Link>
        </div>

        {loadError && items.length === 0 ? (
          <div className="border-line bg-card/85 rounded-3xl border p-8 text-center shadow-xs backdrop-blur-md">
            <p className="text-text text-base font-bold">{t("errorTitle")}</p>
            <p className="text-subtle mt-1 text-sm">{t("errorDesc")}</p>
            <RetryVacanciesButton label={t("errorRetry")} />
          </div>
        ) : items.length === 0 ? (
          <div className="border-line bg-card/85 rounded-3xl border p-10 text-center shadow-xs backdrop-blur-md">
            <BriefcaseIcon size={28} className="text-primary-text mx-auto mb-3" />
            <p className="text-text text-base font-bold">{t("emptyTitle")}</p>
            <p className="text-subtle mx-auto mt-1 max-w-md text-sm">
              {t("emptyDesc")}
            </p>
            <Link
              href="/vacancies"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-800"
            >
              <span>{t("emptyCta")}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        ) : (
          <div className={gridClass}>
            {items.map((v) => {
              const companyLabel = v.companyName?.trim() || t("fallbackCompany");
              const salaryLabel = formatVacancySalary(v);
              const workLabel = v.workType
                ? tWork(v.workType as "FULL_TIME")
                : null;

              return (
                <article
                  key={v.id}
                  className="border-line/80 bg-card/92 hover:border-primary/45 hover:shadow-float flex flex-col justify-between rounded-3xl border p-5 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 dark:border-emerald-400/24 dark:bg-gradient-to-b dark:from-[#09241b]/95 dark:to-[#061812]/95 dark:shadow-[0_18px_36px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(110,231,183,0.14)] dark:hover:border-emerald-300/55"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/vacancies/${v.id}`}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <CompanyLogo
                          companyId={v.companyId}
                          companyName={companyLabel}
                          hasLogo={v.hasLogo}
                          sizeClass="size-10 rounded-xl text-sm"
                        />
                        <span className="text-text truncate text-sm font-bold">
                          {companyLabel}
                        </span>
                      </Link>

                      <BookmarkButton
                        vacancyId={v.id}
                        initialSaved={savedSet.has(v.id)}
                        isAuthenticated={isAuthenticated}
                        loginNext="/"
                        saveLabel={t("bookmarkSave")}
                        savedLabel={t("bookmarkSaved")}
                      />
                    </div>

                    <Link
                      href={`/vacancies/${v.id}`}
                      className="text-text hover:text-primary-text mt-4 block text-lg leading-snug font-extrabold transition-colors"
                    >
                      {v.title}
                    </Link>

                    {(v.location || workLabel) && (
                      <div className="text-subtle mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium">
                        {v.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPinIcon size={14} className="shrink-0" />
                            <span>{v.location}</span>
                          </span>
                        ) : null}
                        {workLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <BriefcaseIcon size={14} className="shrink-0" />
                            <span>{workLabel}</span>
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="border-line/60 mt-5 flex items-center justify-between gap-3 border-t pt-3.5">
                    {salaryLabel ? (
                      <span className="text-text text-sm font-extrabold tabular-nums">
                        {salaryLabel}
                      </span>
                    ) : (
                      <span className="text-subtle text-xs font-semibold">
                        {t("salaryNegotiable")}
                      </span>
                    )}

                    <Link
                      href={`/vacancies/${v.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#059669]/12 px-3.5 py-1.5 text-xs font-bold text-[#047857] transition-colors hover:bg-[#059669] hover:text-white dark:border dark:border-emerald-400/30 dark:bg-[#0d3b2b]/80 dark:text-[#6ee7b7] dark:hover:bg-[#10b981] dark:hover:text-white"
                    >
                      <span>{t("applyBtn")}</span>
                      <ArrowRightIcon size={13} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
