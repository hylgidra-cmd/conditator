"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LandingStats } from "@/backend/landing-stats";
import { ButtonLink } from "@/frontend/components/ds/button";
import { cn } from "@/frontend/components/ds/cn";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import { SpotlightCard } from "@/frontend/components/ds/spotlight-card";
import {
  BriefcaseIcon,
  CheckIcon,
  FileTextIcon,
  MessageIcon,
  SparkIcon,
  UserIcon,
} from "@/frontend/components/icons";

type Mode = "student" | "company";

export function PlatformShowcase({ stats }: { stats: LandingStats }) {
  const t = useTranslations("Landing.showcase");
  const [mode, setMode] = useState<Mode>("student");
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [mode]);

  const steps =
    mode === "student"
      ? [
          { num: "01", label: t("studentStep1"), Icon: FileTextIcon },
          { num: "02", label: t("studentStep2"), Icon: SparkIcon },
          { num: "03", label: t("studentStep3"), Icon: BriefcaseIcon },
          { num: "04", label: t("studentStep4"), Icon: MessageIcon },
        ]
      : [
          { num: "01", label: t("companyStep1"), Icon: BriefcaseIcon },
          { num: "02", label: t("companyStep2"), Icon: SparkIcon },
          { num: "03", label: t("companyStep3"), Icon: UserIcon },
          { num: "04", label: t("companyStep4"), Icon: MessageIcon },
        ];

  const langs = [
    { code: "KK", label: t("langKk") },
    { code: "UZ", label: t("langUz") },
    { code: "RU", label: t("langRu") },
    { code: "EN", label: t("langEn") },
  ];

  const metrics = [
    { value: stats.activeVacancies, label: t("liveVacancies") },
    { value: stats.visibleCvs, label: t("liveCvs") },
    { value: stats.approvedCompanies, label: t("liveCompanies") },
  ];

  const progressWidth = `${(activeStep + 1) * 25}%`;

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className="bg-peach font-ui section-y relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="bg-primary/10 pointer-events-none absolute top-0 left-1/2 -z-0 h-72 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
      />

      <div className="page-x relative z-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <span className="border-line bg-card/80 text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
                <SparkIcon size={14} />
                {t("badge")}
              </span>
              <h2
                id="showcase-title"
                className="text-h2 text-text mt-4 font-extrabold text-balance"
              >
                {t("title")}
              </h2>
              <p className="text-subtle text-lead mt-3">{t("subtitle")}</p>
            </div>

            {/* Interactive Role Switcher */}
            <div
              role="tablist"
              aria-label={t("badge")}
              className="border-line bg-card/90 shadow-soft inline-flex rounded-2xl border p-1.5 backdrop-blur-md"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "student"}
                onClick={() => {
                  setMode("student");
                  setActiveStep(0);
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm",
                  mode === "student"
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_6px_18px_-4px_rgb(5,150,105,0.55)]"
                    : "text-subtle hover:text-text",
                )}
              >
                {t("tabStudent")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "company"}
                onClick={() => {
                  setMode("company");
                  setActiveStep(0);
                }}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm",
                  mode === "company"
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_6px_18px_-4px_rgb(5,150,105,0.55)]"
                    : "text-subtle hover:text-text",
                )}
              >
                {t("tabCompany")}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Senior Bento Grid */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {/* Card 1: 2-col Interactive AI Pipeline */}
          <Reveal delay={75} className="lg:col-span-2">
            <SpotlightCard className="bg-card/90 flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-text text-xl font-extrabold sm:text-2xl">
                    {mode === "student"
                      ? t("studentPipelineTitle")
                      : t("companyPipelineTitle")}
                  </h3>
                  <p className="text-subtle mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
                    {mode === "student"
                      ? t("studentPipelineDesc")
                      : t("companyPipelineDesc")}
                  </p>
                </div>
                <ButtonLink
                  href={mode === "student" ? "/register" : "/company/students"}
                  size="sm"
                  arrow
                >
                  {mode === "student" ? t("ctaStudent") : t("ctaCompany")}
                </ButtonLink>
              </div>

              {/* Animated Pipeline Steps */}
              <div className="mt-8">
                <div className="bg-line mb-5 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="from-primary to-primary-hover h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out"
                    style={{ width: progressWidth }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {steps.map(({ num, label, Icon }, idx) => {
                    const isActive = idx === activeStep;
                    const isDone = idx < activeStep;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setActiveStep(idx)}
                        className={cn(
                          "group rounded-2xl border p-4 text-left transition-all duration-300",
                          isActive
                            ? "border-primary bg-primary-soft/60 shadow-soft -translate-y-0.5"
                            : isDone
                              ? "border-success/30 bg-success-soft/30"
                              : "border-line bg-card-cool/50 hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "inline-flex size-9 items-center justify-center rounded-xl transition-colors",
                              isActive
                                ? "bg-primary text-on-primary"
                                : isDone
                                  ? "bg-success-soft text-success"
                                  : "bg-card text-subtle",
                            )}
                          >
                            {isDone ? (
                              <CheckIcon size={16} />
                            ) : (
                              <Icon size={16} />
                            )}
                          </span>
                          <span className="text-subtle text-xs font-bold tabular-nums">
                            {num}
                          </span>
                        </div>
                        <p className="text-text mt-3 text-xs leading-snug font-bold break-words sm:text-sm">
                          {label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Right column: 2 stacked Bento cards */}
          <div className="flex flex-col gap-5">
            {/* Card 2: 4-Language Native Support */}
            <Reveal delay={150}>
              <SpotlightCard className="bg-card/90 p-6">
                <h3 className="text-text text-lg font-extrabold">
                  {t("langTitle")}
                </h3>
                <p className="text-subtle mt-1.5 text-sm leading-relaxed">
                  {t("langDesc")}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {langs.map((item) => (
                    <div
                      key={item.code}
                      className="border-line bg-card-cool/70 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                    >
                      <span className="bg-primary-soft text-primary-text rounded-md px-1.5 py-0.5 text-[10px] font-extrabold">
                        {item.code}
                      </span>
                      <span className="text-text truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </Reveal>

            {/* Card 3: Privacy & Verified PDF */}
            <Reveal delay={225}>
              <SpotlightCard
                glowColor="rgb(52 211 153 / 0.16)"
                className="bg-card/90 hover:border-success/45 p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-text text-lg font-extrabold">
                    {t("privacyTitle")}
                  </h3>
                  <span className="bg-success-soft text-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
                    <CheckIcon size={12} />
                    {t("privacyBadge")}
                  </span>
                </div>
                <p className="text-subtle mt-2 text-sm leading-relaxed">
                  {t("privacyDesc")}
                </p>
              </SpotlightCard>
            </Reveal>
          </div>
        </div>

        {/* Real DB Live Bar */}
        <Reveal delay={300}>
          <dl className="border-line bg-card/85 shadow-soft mt-5 grid grid-cols-3 gap-4 rounded-3xl border px-6 py-5 backdrop-blur-xl sm:px-8">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-center text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left"
              >
                <dd className="text-primary-text text-2xl font-extrabold sm:text-3xl">
                  <AnimatedNumber value={m.value} />
                </dd>
                <dt className="text-subtle text-xs font-semibold sm:text-sm">
                  {m.label}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
