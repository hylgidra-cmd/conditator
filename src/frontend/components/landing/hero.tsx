import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { ButtonLink } from "@/frontend/components/ds/button";
import { Reveal } from "@/frontend/components/ds/motion";
import { HeroSearch, HeroTerminal } from "./hero-terminal";

export async function Hero({ stats }: { stats: LandingStats }) {
  const t = await getTranslations("Landing.hero");

  const previewSkills = [
    t("previewSkill1"),
    t("previewSkill2"),
    t("previewSkill3"),
  ];

  const quickTags = [
    t("tag1"),
    t("tag2"),
    t("tag3"),
    t("tag4"),
    t("tag5"),
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="bg-canvas font-ui relative isolate overflow-hidden pt-8 pb-16 sm:pt-12 lg:pt-16 lg:pb-20"
    >
      {/* Architectural Sage-Emerald Grid + Ambient Spotlights */}
      <div
        aria-hidden
        className="bg-cyber-grid pointer-events-none absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_80%)] opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 -z-10 h-96 w-[56rem] -translate-x-1/2 rounded-full bg-emerald-500/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[-8%] -z-10 size-96 rounded-full bg-teal-500/15 blur-3xl"
      />

      <div className="page-x space-y-12">
        {/* Top Monumental Editorial Hero + Command Search */}
        <Reveal immediate>
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <span className="border-primary/35 bg-primary-soft text-primary-text shadow-soft inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-extrabold tracking-wide">
              <span
                aria-hidden
                className="ds-pulse-ring inline-block size-2 rounded-full bg-emerald-500"
              />
              {t("badge")}
            </span>

            <h1
              id="hero-title"
              className="text-display text-gradient-blue mt-6 max-w-[18ch] font-black tracking-tight text-balance"
            >
              {t("title")}
            </h1>

            <p className="text-subtle text-lead mt-5 max-w-2xl text-balance">
              {t("text")}
            </p>

            {/* Wide Command-Center Vacancy Search + All-Industry Quick Tags */}
            <HeroSearch
              placeholder={t("searchPlaceholder")}
              buttonLabel={t("searchButton")}
              quickLabel={t("quickLabel")}
              tags={quickTags}
            />

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
              <ButtonLink href="/register" size="lg" arrow>
                {t("cta")}
              </ButtonLink>
              <ButtonLink href="/vacancies" variant="outline" size="lg">
                {t("secondaryCta")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        {/* Full-Width 3-Column Bento Command Grid */}
        <Reveal immediate delay={75}>
          <HeroTerminal
            stats={stats}
            labels={{
              mode1: t("terminalMode1"),
              mode2: t("terminalMode2"),
              mode3: t("terminalMode3"),
              previewTitle: t("previewTitle"),
              previewStatus: t("previewStatus"),
              previewMatch: t("previewMatch"),
              liveVacancies: t("liveVacancies"),
              liveCvs: t("liveCvs"),
              liveCompanies: t("liveCompanies"),
              cta: t("cta"),
              secondaryCta: t("secondaryCta"),
              skills: previewSkills,
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
