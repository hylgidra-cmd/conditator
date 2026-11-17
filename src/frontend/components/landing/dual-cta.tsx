import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/frontend/components/ds/button";
import { Reveal } from "@/frontend/components/ds/motion";
import { BuildingIcon, ResumeIcon } from "@/frontend/components/icons";

export async function DualCta() {
  const t = await getTranslations("Landing.ctaBand");

  return (
    <section
      id="profile"
      aria-label={t("studentTitle")}
      className="bg-canvas font-ui section-y relative overflow-hidden"
    >
      <div className="page-x grid gap-6 lg:grid-cols-2">
        {/* Student Card: High-Contrast Deep Forest Obsidian */}
        <Reveal>
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#061A14] p-7 text-white shadow-[0_24px_60px_-15px_rgb(6,26,20,0.45)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-3.5 py-1 text-xs font-extrabold text-emerald-300">
                <ResumeIcon size={14} />
                {t("studentBadge")}
              </span>
              <h2 className="text-h2 mt-5 font-black text-white text-balance">
                {t("studentTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-emerald-100/80">
                {t("studentDesc")}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register?role=STUDENT" size="lg" arrow>
                {t("studentPrimary")}
              </ButtonLink>
              <ButtonLink
                href="/vacancies"
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                {t("studentSecondary")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        {/* Company Card: Crisp White/Surface Bento with Emerald-Teal Accents */}
        <Reveal delay={150}>
          <div className="border-primary/30 bg-card shadow-float relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-7 sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-teal-500/15 blur-3xl"
            />
            <div className="relative z-10">
              <span className="border-primary/35 bg-primary-soft text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                <BuildingIcon size={14} />
                {t("companyBadge")}
              </span>
              <h2 className="text-h2 text-text mt-5 font-black text-balance">
                {t("companyTitle")}
              </h2>
              <p className="text-subtle mt-3 text-base leading-relaxed">
                {t("companyDesc")}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register?role=COMPANY" size="lg" arrow>
                {t("companyPrimary")}
              </ButtonLink>
              <ButtonLink href="/company/students" variant="outline" size="lg">
                {t("companySecondary")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
