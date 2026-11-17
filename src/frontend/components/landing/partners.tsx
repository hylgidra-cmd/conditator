import { getTranslations } from "next-intl/server";
import type { ApprovedCompanyBadge, LandingStats } from "@/backend/landing-stats";
import { Reveal } from "@/frontend/components/ds/motion";
import { Link } from "@/i18n/navigation";

function wavePath(y: number, amp: number) {
  return `M0 ${y} Q360 ${y - amp} 720 ${y} T1440 ${y} T2160 ${y} T2880 ${y} V240 H0 Z`;
}

function CompanyItem({ company }: { company: ApprovedCompanyBadge }) {
  const initial = company.name.slice(0, 1).toUpperCase();
  return (
    <li>
      <Link
        href={`/vacancies?q=${encodeURIComponent(company.name)}`}
        className="border-line bg-card/90 shadow-soft hover:border-primary/50 hover:shadow-float flex min-w-0 items-center gap-3 rounded-2xl border p-2.5 pr-5 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {company.hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/companies/${company.id}/logo`}
            alt={company.name}
            className="size-10 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-black/5 sm:size-11"
          />
        ) : (
          <span className="bg-primary-soft text-primary-text flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold sm:size-11">
            {initial}
          </span>
        )}
        <span className="min-w-0">
          <span className="font-ui text-text block truncate text-sm leading-tight font-bold tracking-tight sm:text-[0.9375rem]">
            {company.name}
          </span>
          {company.industry ? (
            <span className="text-subtle block truncate text-[11px]">
              {company.industry}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

function WaveBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <svg
        viewBox="0 0 2880 240"
        preserveAspectRatio="none"
        className="ds-wave ds-wave-slow absolute bottom-0 left-0 h-36 w-[200%] sm:h-44"
      >
        <path
          d={wavePath(70, 46)}
          className="fill-primary"
          fillOpacity={0.07}
        />
      </svg>
      <svg
        viewBox="0 0 2880 240"
        preserveAspectRatio="none"
        className="ds-wave ds-wave-reverse absolute bottom-0 left-0 h-28 w-[200%] sm:h-32"
      >
        <path
          d={wavePath(110, 38)}
          className="fill-primary"
          fillOpacity={0.1}
        />
      </svg>
      <div className="bg-primary/20 absolute -top-20 -right-20 size-72 rounded-full blur-3xl" />
    </div>
  );
}

/** Bosh sahifadagi hamkorlar bloki: faqat bazadagi tasdiqlangan real kompaniyalarni chiqaradi. */
export async function Partners({ stats }: { stats: LandingStats }) {
  if (stats.approvedCompanyList.length === 0) return null;
  const t = await getTranslations("Landing.partners");

  return (
    <section
      id="companies"
      aria-labelledby="partners-title"
      className="bg-canvas font-ui pb-4"
    >
      <div className="page-x">
        <Reveal>
          <div className="bg-card/85 border-primary/20 rounded-card shadow-float relative isolate overflow-hidden border px-6 pt-12 pb-14 backdrop-blur-xl sm:px-10 sm:pt-14 sm:pb-16">
            <WaveBackdrop />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <h2
                id="partners-title"
                className="font-ui text-text max-w-xl text-center text-xl font-extrabold tracking-tight text-balance sm:text-2xl lg:text-left"
              >
                {t.rich("title", {
                  accent: (chunks) => (
                    <span className="text-primary-text">{chunks}</span>
                  ),
                })}
              </h2>
              <ul
                aria-label={t("listLabel")}
                className="flex flex-wrap items-center justify-center gap-3.5 lg:justify-end"
              >
                {stats.approvedCompanyList.map((company) => (
                  <CompanyItem key={company.id} company={company} />
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
