import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckIcon,
  ResumeIcon,
  SparkIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

export async function DualCta() {
  const [t, tHero] = await Promise.all([
    getTranslations("Landing.ctaBand"),
    getTranslations("Landing.hero"),
  ]);

  return (
    <section
      id="profile"
      aria-label={t("studentTitle")}
      className="bg-canvas font-ui section-y relative overflow-hidden"
    >
      <div className="page-x">
        <Reveal>
          {/* Panoramic Architectural Command Hub with Central Orbital Bridge */}
          <div className="relative isolate overflow-hidden rounded-[2.25rem] border border-emerald-500/30 bg-gradient-to-br from-[#041410] via-[#07221B] to-[#0A2E25] p-6 text-white shadow-[0_32px_80px_-20px_rgb(4,20,16,0.65)] sm:p-10 lg:p-14">
            {/* Background Orbital Rings & Glows */}
            <div
              aria-hidden
              className="ds-orbit-slow pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-emerald-400/15"
            />
            <div
              aria-hidden
              style={{ animationDirection: "reverse", animationDuration: "24s" }}
              className="ds-orbit-slow pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/15"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-28 left-1/4 -z-10 size-80 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-28 -z-10 size-80 rounded-full bg-teal-400/20 blur-3xl"
            />

            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
              {/* LEFT: Candidate / Student Launchpad */}
              <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-white/6 p-6 backdrop-blur-xl sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-3.5 py-1 text-xs font-extrabold text-emerald-300">
                      <ResumeIcon size={14} />
                      {t("studentBadge")}
                    </span>
                    <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                      <SparkIcon size={18} />
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl leading-tight font-black tracking-tight text-white text-balance sm:text-3xl">
                    {t("studentTitle")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                    {t("studentDesc")}
                  </p>

                  {/* Feature chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-100">
                      <CheckIcon size={13} className="text-emerald-400" />
                      {tHero("terminalMode1")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-100">
                      <CheckIcon size={13} className="text-emerald-400" />
                      {tHero("previewStatus")}
                    </span>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register?role=STUDENT"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_12px_28px_-6px_rgb(16,185,129,0.55)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                  >
                    <span>{t("studentPrimary")}</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                  <Link
                    href="/vacancies"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
                  >
                    {t("studentSecondary")}
                  </Link>
                </div>
              </div>

              {/* CENTER: Rotating AI Ecosystem Core */}
              <div className="relative mx-auto flex flex-col items-center justify-center py-2">
                <div className="relative flex size-24 items-center justify-center rounded-full border border-emerald-400/40 bg-[#041410] shadow-[0_0_40px_rgb(16,185,129,0.45)]">
                  <div
                    aria-hidden
                    className="ds-orbit-slow absolute -inset-2.5 rounded-full border border-dashed border-emerald-400/50"
                  />
                  <div
                    aria-hidden
                    className="ds-pulse-ring absolute inset-0 rounded-full bg-emerald-500/20"
                  />
                  <span className="relative z-10 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg">
                    <SparkIcon size={24} />
                  </span>
                </div>
                <span className="mt-3 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-extrabold tracking-widest text-emerald-300 uppercase">
                  {tHero("previewMatch")}
                </span>
              </div>

              {/* RIGHT: Employer / Company Talent Hub */}
              <div className="flex flex-col justify-between rounded-3xl border border-teal-400/25 bg-gradient-to-br from-white/12 to-white/5 p-6 backdrop-blur-xl sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/15 px-3.5 py-1 text-xs font-extrabold text-amber-300">
                      <BuildingIcon size={14} />
                      {t("companyBadge")}
                    </span>
                    <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                      <BriefcaseIcon size={18} />
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl leading-tight font-black tracking-tight text-white text-balance sm:text-3xl">
                    {t("companyTitle")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                    {t("companyDesc")}
                  </p>

                  {/* Feature chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-100">
                      <CheckIcon size={13} className="text-amber-300" />
                      {tHero("previewTitle")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-100">
                      <CheckIcon size={13} className="text-amber-300" />
                      {tHero("terminalMode3")}
                    </span>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register?role=COMPANY"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-emerald-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
                  >
                    <span>{t("companyPrimary")}</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                  <Link
                    href="/company/students"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
                  >
                    {t("companySecondary")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
