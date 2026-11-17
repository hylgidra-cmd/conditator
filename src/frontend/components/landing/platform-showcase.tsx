"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LandingStats } from "@/backend/landing-stats";
import { ButtonLink } from "@/frontend/components/ds/button";
import { cn } from "@/frontend/components/ds/cn";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
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
    }, 2600);
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

  // 4 orbital node positions around the circle (Top, Right, Bottom, Left)
  const orbitPositions = [
    "top-2 left-1/2 -translate-x-1/2",
    "top-1/2 right-2 -translate-y-1/2",
    "bottom-2 left-1/2 -translate-x-1/2",
    "top-1/2 left-2 -translate-y-1/2",
  ] as const;

  const activeStepItem = steps[activeStep];
  const ActiveIcon = activeStepItem.Icon;
  const ringCircumference = 2 * Math.PI * 128;
  const ringOffset = ringCircumference * (1 - (activeStep + 1) / 4);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className="bg-peach font-ui section-y relative overflow-hidden"
    >
      {/* Ambient emerald glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/12 blur-3xl"
      />

      <div className="page-x relative z-10">
        {/* Section Header + Role Switcher */}
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="border-primary/35 bg-card text-primary-text shadow-soft inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-extrabold tracking-wide">
              <SparkIcon size={14} />
              {t("badge")}
            </span>
            <h2
              id="showcase-title"
              className="text-h2 text-text mt-4 max-w-2xl font-black text-balance"
            >
              {t("title")}
            </h2>
            <p className="text-subtle text-lead mt-3 max-w-xl">
              {t("subtitle")}
            </p>

            {/* Interactive Role Switcher Pill */}
            <div
              role="tablist"
              aria-label={t("badge")}
              className="border-line bg-card shadow-float mt-7 inline-flex rounded-full border p-1.5"
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
                  "cursor-pointer rounded-full px-6 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm",
                  mode === "student"
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_-4px_rgb(5,150,105,0.55)]"
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
                  "cursor-pointer rounded-full px-6 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm",
                  mode === "company"
                    ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_-4px_rgb(5,150,105,0.55)]"
                    : "text-subtle hover:text-text",
                )}
              >
                {t("tabCompany")}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Main Interactive Orbital Radar Stage */}
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-12">
          {/* Left Panel (4 cols): Active Step Detail + CTA */}
          <Reveal delay={75} className="lg:col-span-4">
            <div className="border-line bg-card shadow-float space-y-6 rounded-3xl border p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>{`${activeStepItem.num} / 04`}</span>
              </div>

              <div>
                <h3 className="text-text text-xl font-black sm:text-2xl">
                  {mode === "student"
                    ? t("studentPipelineTitle")
                    : t("companyPipelineTitle")}
                </h3>
                <p className="text-subtle mt-2 text-sm leading-relaxed">
                  {mode === "student"
                    ? t("studentPipelineDesc")
                    : t("companyPipelineDesc")}
                </p>
              </div>

              {/* Step selector list synchronized with the circle */}
              <div className="space-y-2">
                {steps.map(({ num, label, Icon }, idx) => {
                  const isActive = idx === activeStep;
                  const isDone = idx < activeStep;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300",
                        isActive
                          ? "border-emerald-500 bg-gradient-to-r from-emerald-600/12 to-teal-500/8 shadow-xs"
                          : "border-line bg-card-cool/60 hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                            isActive
                              ? "bg-emerald-600 text-white"
                              : isDone
                                ? "bg-success-soft text-success"
                                : "bg-card text-subtle",
                          )}
                        >
                          {isDone ? <CheckIcon size={14} /> : <Icon size={14} />}
                        </span>
                        <span className="text-text text-xs font-extrabold sm:text-sm">
                          {label}
                        </span>
                      </div>
                      <span className="text-primary-text text-xs font-black tabular-nums">
                        {num}
                      </span>
                    </button>
                  );
                })}
              </div>

              <ButtonLink
                href={mode === "student" ? "/register" : "/company/students"}
                size="md"
                arrow
                className="w-full"
              >
                {mode === "student" ? t("ctaStudent") : t("ctaCompany")}
              </ButtonLink>
            </div>
          </Reveal>

          {/* Center Panel (4 cols): Circular / Orbital Radar Animation */}
          <Reveal delay={150} className="lg:col-span-4">
            <div className="relative mx-auto flex aspect-square w-full max-w-[25rem] items-center justify-center">
              {/* Outer spinning dashed orbit */}
              <div
                aria-hidden
                className="ds-orbit-slow border-primary/30 pointer-events-none absolute inset-3 rounded-full border-2 border-dashed"
              />
              {/* Second counter-rotating orbit ring */}
              <div
                aria-hidden
                style={{ animationDirection: "reverse", animationDuration: "20s" }}
                className="ds-orbit-slow pointer-events-none absolute inset-12 rounded-full border border-teal-500/35"
              >
                <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
                <span className="absolute -bottom-1.5 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]" />
              </div>

              {/* SVG Progress Ring */}
              <svg
                aria-hidden
                viewBox="0 0 300 300"
                className="pointer-events-none absolute inset-0 size-full -rotate-90"
              >
                <circle
                  cx="150"
                  cy="150"
                  r="128"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/15"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="128"
                  fill="none"
                  stroke="url(#orbital-emerald-grad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient
                    id="orbital-emerald-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Pulsing AI Core */}
              <div className="relative z-10 flex size-40 flex-col items-center justify-center rounded-full border border-emerald-400/35 bg-[#061A14] p-4 text-center text-white shadow-[0_0_50px_-10px_rgb(16,185,129,0.55)]">
                <div
                  aria-hidden
                  className="ds-pulse-ring pointer-events-none absolute -inset-3 rounded-full border border-emerald-400/30"
                />
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 shadow-md">
                  <ActiveIcon size={22} />
                </span>
                <span className="mt-2 text-[11px] font-black tracking-wider text-emerald-300 uppercase">
                  {activeStepItem.num}
                </span>
                <p
                  key={`${mode}-${activeStep}`}
                  className="ds-slide-in mt-0.5 line-clamp-2 text-xs leading-tight font-bold text-white"
                >
                  {activeStepItem.label}
                </p>
              </div>

              {/* 4 Orbiting Step Nodes */}
              {steps.map(({ num, label, Icon }, idx) => {
                const isActive = idx === activeStep;
                const isDone = idx < activeStep;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    aria-label={label}
                    className={cn(
                      "absolute z-20 flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold shadow-lg backdrop-blur-xl transition-all duration-300",
                      orbitPositions[idx],
                      isActive
                        ? "scale-110 border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_10px_25px_-5px_rgb(5,150,105,0.65)]"
                        : isDone
                          ? "border-emerald-500/40 bg-card text-primary-text"
                          : "border-line bg-card/95 text-text hover:border-primary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-[10px] font-black",
                        isActive
                          ? "bg-white/20 text-white"
                          : isDone
                            ? "bg-success-soft text-success"
                            : "bg-primary-soft text-primary-text",
                      )}
                    >
                      {isDone ? <CheckIcon size={12} /> : <Icon size={12} />}
                    </span>
                    <span className="max-w-[7.5rem] truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Right Panel (4 cols): 4-Language Matrix + Privacy Shield + Live Metrics */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Reveal delay={225}>
              <div className="border-line bg-card shadow-float rounded-3xl border p-6">
                <h3 className="text-text text-lg font-black">
                  {t("langTitle")}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed sm:text-sm">
                  {t("langDesc")}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {langs.map((item) => (
                    <div
                      key={item.code}
                      className="border-line bg-card-cool flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold"
                    >
                      <span className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-2 py-1 text-[10px] font-black text-white">
                        {item.code}
                      </span>
                      <span className="text-text truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="rounded-3xl border border-emerald-500/30 bg-[#061A14] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-black text-white sm:text-lg">
                    {t("privacyTitle")}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-3 py-1 text-[11px] font-extrabold text-emerald-300">
                    <CheckIcon size={12} />
                    {t("privacyBadge")}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                  {t("privacyDesc")}
                </p>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <dd className="text-lg font-black text-emerald-300 tabular-nums sm:text-xl">
                        <AnimatedNumber value={m.value} />
                      </dd>
                      <dt className="truncate text-[10px] font-semibold text-emerald-100/70">
                        {m.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
