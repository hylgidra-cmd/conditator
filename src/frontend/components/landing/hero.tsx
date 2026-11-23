import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { ButtonLink } from "@/frontend/components/ds/button";
import { Reveal } from "@/frontend/components/ds/motion";
import { HeroSearch } from "./hero-terminal";

export async function Hero({ stats }: { stats: LandingStats }) {
  const t = await getTranslations("Landing.hero");
  return (
    <section
      className="orbit-hero font-ui relative overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="page-x relative">
        <div className="grid items-center gap-4 pt-12 lg:grid-cols-[.9fr_1.1fr] lg:pt-20">
          <Reveal immediate>
            <div className="relative z-10">
              <span className="text-primary-text text-xs font-extrabold tracking-[.18em] uppercase">
                {t("badge")}
              </span>
              <h1
                id="hero-title"
                className="text-text mt-5 max-w-[16ch] text-5xl leading-[1.04] font-black tracking-tight sm:text-6xl lg:text-7xl"
              >
                {t("title")}
              </h1>
              <p className="text-subtle mt-5 max-w-xl text-lg leading-relaxed">
                {t("text")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/vacancies" size="lg" arrow>
                  {t("secondaryCta")}
                </ButtonLink>
                <ButtonLink href="/register" size="lg" variant="outline">
                  {t("cta")}
                </ButtonLink>
              </div>
              <div className="text-subtle mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <span>
                  {stats.activeVacancies} · {t("liveVacancies")}
                </span>
                <span>
                  {stats.approvedCompanies} · {t("liveCompanies")}
                </span>
              </div>
            </div>
          </Reveal>
          <div className="orbit-art relative mx-auto w-full max-w-3xl">
            <Image
              src="/career-orbit.png"
              width={1752}
              height={897}
              alt=""
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl pb-12">
          <HeroSearch
            placeholder={t("searchPlaceholder")}
            buttonLabel={t("searchButton")}
            quickLabel={t("quickLabel")}
            tags={[t("tag1"), t("tag2"), t("tag3"), t("tag4"), t("tag5")]}
          />
        </div>
      </div>
    </section>
  );
}
