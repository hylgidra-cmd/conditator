import { getTranslations } from "next-intl/server";
import type { LandingStats } from "@/backend/landing-stats";
import { Reveal } from "@/frontend/components/ds/motion";
import { SparkIcon } from "@/frontend/components/icons";
import { PromoBillboardClient } from "./promo-billboard-client";

export async function PromoShowcase({ stats }: { stats: LandingStats }) {
  const [t, tLive, tDetail] = await Promise.all([
    getTranslations("Landing.promo"),
    getTranslations("Landing.liveJobs"),
    getTranslations("VacancyDetail"),
  ]);

  const industries = [
    {
      title: t("ind1"),
      subtitle: t("ind1Sub"),
      query: t("ind1Q"),
      tone: "bg-gradient-to-br from-emerald-600 to-teal-700",
      iconKey: "edu" as const,
    },
    {
      title: t("ind2"),
      subtitle: t("ind2Sub"),
      query: t("ind2Q"),
      tone: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconKey: "fin" as const,
    },
    {
      title: t("ind3"),
      subtitle: t("ind3Sub"),
      query: t("ind3Q"),
      tone: "bg-gradient-to-br from-teal-600 to-cyan-700",
      iconKey: "sales" as const,
    },
    {
      title: t("ind4"),
      subtitle: t("ind4Sub"),
      query: t("ind4Q"),
      tone: "bg-gradient-to-br from-rose-500 to-red-600",
      iconKey: "med" as const,
    },
    {
      title: t("ind5"),
      subtitle: t("ind5Sub"),
      query: t("ind5Q"),
      tone: "bg-gradient-to-br from-emerald-700 to-green-900",
      iconKey: "it" as const,
    },
    {
      title: t("ind6"),
      subtitle: t("ind6Sub"),
      query: t("ind6Q"),
      tone: "bg-gradient-to-br from-amber-600 to-yellow-700",
      iconKey: "eng" as const,
    },
  ];

  const workTypes: Record<string, string> = {
    FULL_TIME: tDetail("workTypes.FULL_TIME"),
    PART_TIME: tDetail("workTypes.PART_TIME"),
    REMOTE: tDetail("workTypes.REMOTE"),
    INTERNSHIP: tDetail("workTypes.INTERNSHIP"),
  };

  return (
    <section
      id="categories"
      aria-labelledby="promo-title"
      className="bg-canvas font-ui section-y relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-96 w-[56rem] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl"
      />

      <div className="page-x space-y-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="border-primary/35 bg-primary-soft text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold tracking-wide">
              <SparkIcon size={14} />
              {t("badge")}
            </span>
            <h2
              id="promo-title"
              className="text-h2 text-text mt-4 font-black text-balance"
            >
              {t("title")}
            </h2>
            <p className="text-subtle text-lead mt-3">{t("subtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={75}>
          <PromoBillboardClient
            vacancies={stats.featuredVacancies}
            workTypes={workTypes}
            industries={industries}
            labels={{
              slideTabs: [
                t("slide1Tab"),
                t("slide2Tab"),
                t("slide3Tab"),
                t("slide4Tab"),
              ],
              slide1: {
                badge: t("slide1Badge"),
                title: t("slide1Title"),
                desc: t("slide1Desc"),
                cta: t("slide1Cta"),
                alt: t("slide1Alt"),
              },
              slide2: {
                badge: t("slide2Badge"),
                title: t("slide2Title"),
                desc: t("slide2Desc"),
              },
              slide3: {
                badge: t("slide3Badge"),
                title: t("slide3Title"),
                desc: t("slide3Desc"),
                cta: t("slide3Cta"),
                viewAll: tLive("viewAll"),
              },
              slide4: {
                badge: t("slide4Badge"),
                title: t("slide4Title"),
                desc: t("slide4Desc"),
                negotiable: tLive("negotiable"),
                applyBtn: tLive("applyBtn"),
                viewAll: tLive("viewAll"),
                empty: tLive("empty"),
              },
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
