import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  SparkIcon,
} from "@/frontend/components/icons";
import { Reveal } from "@/frontend/components/ds/motion";
import { HeroSearch } from "./hero-terminal";
import { RoleJourney } from "./role-journey";

export async function HomeExperience({ stats }: { stats: LandingStats }) {
  const [hero, promo, showcase, cta, workType] = await Promise.all([
    getTranslations("Landing.hero"),
    getTranslations("Landing.promo"),
    getTranslations("Landing.showcase"),
    getTranslations("Landing.ctaBand"),
    getTranslations("VacancyDetail.workTypes"),
  ]);
  const featured = stats.featuredVacancies[0];
  const workTypes: Record<string, string> = {
    FULL_TIME: workType("FULL_TIME"),
    PART_TIME: workType("PART_TIME"),
    REMOTE: workType("REMOTE"),
    INTERNSHIP: workType("INTERNSHIP"),
  };
  const categories = [
    [promo("ind1"), promo("ind1Sub"), promo("ind1Q")],
    [promo("ind2"), promo("ind2Sub"), promo("ind2Q")],
    [promo("ind3"), promo("ind3Sub"), promo("ind3Q")],
    [promo("ind4"), promo("ind4Sub"), promo("ind4Q")],
    [promo("ind5"), promo("ind5Sub"), promo("ind5Q")],
    [promo("ind6"), promo("ind6Sub"), promo("ind6Q")],
  ] as const;

  return (
    <main className="font-ui overflow-hidden">
      <section className="career-hero relative overflow-hidden">
        <div
          className="career-hero-grid pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div className="page-x relative grid gap-12 pt-16 pb-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:pt-24 lg:pb-28">
          <div className="relative z-10">
            <Reveal immediate>
              <div className="career-eyebrow inline-flex items-center gap-2">
                <span className="bg-primary size-2 rounded-full" aria-hidden />
                {hero("badge")}
              </div>
              <h1 className="career-heading text-text mt-7 max-w-[15ch] text-[clamp(3.1rem,7vw,6.2rem)] leading-[.99] font-extrabold tracking-[-.07em] text-balance">
                {hero("title")}
              </h1>
              <p className="text-subtle mt-7 max-w-xl text-base leading-[1.75] sm:text-lg">
                {hero("text")}
              </p>
              <HeroSearch
                placeholder={hero("searchPlaceholder")}
                buttonLabel={hero("searchButton")}
                quickLabel={hero("quickLabel")}
                tags={[
                  hero("tag1"),
                  hero("tag2"),
                  hero("tag3"),
                  hero("tag4"),
                  hero("tag5"),
                ]}
              />
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className="career-action-primary">
                  {hero("cta")} <ArrowRightIcon size={18} />
                </Link>
                <Link href="/vacancies" className="career-action-text">
                  {hero("secondaryCta")} <ArrowRightIcon size={17} />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={75}>
            <div className="career-stage relative mx-auto w-full max-w-[36rem]">
              <div className="career-stage-top flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[.12em] uppercase">
                  <span
                    className="bg-primary size-2 rounded-full"
                    aria-hidden
                  />
                  {hero("terminalMode2")}
                </div>
                <span className="text-subtle text-xs">Candidator / Live</span>
              </div>
              <div className="career-stage-main">
                <div className="text-subtle text-xs font-bold tracking-wider uppercase">
                  {promo("slide4Badge")}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-text text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
                      {featured?.title ?? promo("slide4Title")}
                    </h2>
                    <p className="text-subtle mt-2 text-sm">
                      {featured?.companyName ?? promo("slide4Desc")}
                    </p>
                  </div>
                  <span className="career-stage-icon">
                    <BriefcaseIcon size={22} />
                  </span>
                </div>
                {featured ? (
                  <div className="mt-7 flex flex-wrap gap-2">
                    {featured.location && (
                      <span className="career-stage-tag">
                        {featured.location}
                      </span>
                    )}
                    {featured.workType && (
                      <span className="career-stage-tag">
                        {workTypes[featured.workType] ?? featured.workType}
                      </span>
                    )}
                    {featured.skills.slice(0, 2).map((skill) => (
                      <span key={skill} className="career-stage-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="career-stage-divider" />
                <Link
                  href={featured ? `/vacancies/${featured.id}` : "/vacancies"}
                  className="career-stage-link"
                >
                  {hero("secondaryCta")} <ArrowRightIcon size={18} />
                </Link>
              </div>
              <div className="career-stage-bottom divide-line grid grid-cols-3 divide-x">
                {[
                  [stats.activeVacancies, hero("liveVacancies")],
                  [stats.visibleCvs, hero("liveCvs")],
                  [stats.approvedCompanies, hero("liveCompanies")],
                ].map(([value, label]) => (
                  <div key={label} className="px-3 py-5 text-center sm:px-5">
                    <strong className="text-text block text-2xl font-extrabold tabular-nums">
                      {value}
                    </strong>
                    <span className="text-subtle mt-1 block text-[11px] leading-snug">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="career-float-note absolute -bottom-5 -left-4 hidden items-center gap-2 sm:flex">
                <SparkIcon size={16} /> {showcase("privacyBadge")}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="career-section page-x py-20 sm:py-28" id="categories">
        <Reveal>
          <div className="career-section-head flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="career-kicker">{promo("badge")}</span>
              <h2 className="career-section-title mt-4 max-w-2xl">
                {promo("title")}
              </h2>
              <p className="text-subtle mt-4 max-w-2xl leading-relaxed">
                {promo("subtitle")}
              </p>
            </div>
            <Link href="/vacancies" className="career-action-text">
              {hero("secondaryCta")} <ArrowRightIcon size={17} />
            </Link>
          </div>
        </Reveal>
        <div className="border-line bg-line mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([title, subtitle, query], index) => (
            <Link
              key={title}
              href={`/vacancies?q=${encodeURIComponent(query)}`}
              className="career-category group"
            >
              <span className="text-primary-text text-xs font-bold tabular-nums">
                0{index + 1}
              </span>
              <h3 className="text-text mt-9 text-xl leading-snug font-bold tracking-tight">
                {title}
              </h3>
              <p className="text-subtle mt-2 text-sm leading-relaxed">
                {subtitle}
              </p>
              <span className="career-category-arrow">
                <ArrowRightIcon size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <RoleJourney
        title={showcase("title")}
        subtitle={showcase("subtitle")}
        studentLabel={showcase("tabStudent")}
        companyLabel={showcase("tabCompany")}
        studentSteps={[
          showcase("studentStep1"),
          showcase("studentStep2"),
          showcase("studentStep3"),
          showcase("studentStep4"),
        ]}
        companySteps={[
          showcase("companyStep1"),
          showcase("companyStep2"),
          showcase("companyStep3"),
          showcase("companyStep4"),
        ]}
        studentCta={showcase("ctaStudent")}
        companyCta={showcase("ctaCompany")}
      />

      <section className="page-x py-20 sm:py-28" id="companies">
        <Reveal>
          <div className="career-section-head flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="career-kicker">{promo("slide4Badge")}</span>
              <h2 className="career-section-title mt-4">
                {promo("slide4Title")}
              </h2>
              <p className="text-subtle mt-4 max-w-2xl leading-relaxed">
                {promo("slide4Desc")}
              </p>
            </div>
            <Link href="/vacancies" className="career-action-text">
              {hero("secondaryCta")} <ArrowRightIcon size={17} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.featuredVacancies.slice(0, 3).map((job) => (
            <Link
              key={job.id}
              href={`/vacancies/${job.id}`}
              className="career-job group"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="career-job-icon">
                  <BriefcaseIcon size={20} />
                </span>
                <ArrowRightIcon
                  size={18}
                  className="text-subtle group-hover:text-primary-text transition-colors"
                />
              </div>
              <h3 className="text-text mt-7 text-xl font-bold tracking-tight">
                {job.title}
              </h3>
              <p className="text-subtle mt-2 text-sm">
                {job.companyName}
                {job.location ? ` · ${job.location}` : ""}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {job.skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="career-job-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {stats.featuredVacancies.length === 0 && (
            <div className="career-job md:col-span-2 lg:col-span-3">
              <p className="text-subtle">{promo("slide4Desc")}</p>
              <Link href="/vacancies" className="career-action-text mt-5">
                {hero("secondaryCta")} <ArrowRightIcon size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="career-closing" id="profile">
        <div className="page-x grid gap-8 py-18 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <span className="career-closing-label">
              <SparkIcon size={16} /> {cta("studentBadge")}
            </span>
            <h2 className="mt-5 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              {cta("studentTitle")}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {cta("studentDesc")}
            </p>
            <Link
              href="/register?role=STUDENT"
              className="career-closing-link mt-8"
            >
              {cta("studentPrimary")} <ArrowRightIcon size={18} />
            </Link>
          </div>
          <div className="border-t border-white/15 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16">
            <span className="career-closing-label">
              <BuildingIcon size={16} /> {cta("companyBadge")}
            </span>
            <h2 className="mt-5 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              {cta("companyTitle")}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {cta("companyDesc")}
            </p>
            <Link
              href="/register?role=COMPANY"
              className="career-closing-link mt-8"
            >
              {cta("companyPrimary")} <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
