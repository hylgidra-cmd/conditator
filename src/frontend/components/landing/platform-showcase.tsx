"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LandingStats } from "@/backend/landing-stats";
import { cn } from "@/frontend/components/ds/cn";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  FileTextIcon,
  MessageIcon,
  SparkIcon,
  UserIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

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

  // 4 diagonal positions on the outer ring (45°, 135°, 225°, 315°) — never overlaps the center!
  const diagonalNodes = [
    "top-[6%] left-[6%]",
    "top-[6%] right-[6%]",
    "bottom-[6%] right-[6%]",
    "bottom-[6%] left-[6%]",
  ] as const;

  const activeStepItem = steps[activeStep];
  const ActiveIcon = activeStepItem.Icon;
  const ringCircumference = 2 * Math.PI * 136;
  const ringOffset = ringCircumference * (1 - (activeStep + 1) / 4);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className="bg-canvas font-ui section-y relative overflow-hidden"
    >
      <div className="page-x">
        <Reveal>
          {/* Monumental Dark Forest Obsidian Planetarium Stage */}
          <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-emerald-500/30 bg-gradient-to-br from-[#03110D] via-[#061C16] to-[#08271F] p-6 text-white shadow-[0_32px_90px_-20px_rgb(3,17,13,0.7)] sm:p-10 lg:p-14">
            {/* Ambient Aurora & Grid */}
            <div
              aria-hidden
              className="bg-cyber-grid pointer-events-none absolute inset-0 -z-20 opacity-30"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/4 -z-10 size-96 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-teal-400/15 blur-3xl"
            />

            {/* Top Header + Role Switcher */}
            <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-1.5 text-xs font-extrabold tracking-wide text-emerald-300">
                  <SparkIcon size={14} />
                  {t("badge")}
                </span>
                <h2
                  id="showcase-title"
                  className="text-h2 mt-4 font-black text-white text-balance"
                >
                  {t("title")}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-emerald-100/75 sm:text-base">
                  {t("subtitle")}
                </p>
              </div>

              <div
                role="tablist"
                aria-label={t("badge")}
                className="inline-flex rounded-full border border-white/15 bg-white/6 p-1.5 backdrop-blur-xl"
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
                    "cursor-pointer rounded-full px-5 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm",
                    mode === "student"
                      ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 shadow-[0_8px_24px_-4px_rgb(16,185,129,0.65)]"
                      : "text-emerald-100/75 hover:text-white",
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
                    "cursor-pointer rounded-full px-5 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm",
                    mode === "company"
                      ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 shadow-[0_8px_24px_-4px_rgb(16,185,129,0.65)]"
                      : "text-emerald-100/75 hover:text-white",
                  )}
                >
                  {t("tabCompany")}
                </button>
              </div>
            </div>

            {/* Main 2-Column Planetarium Orbital Radar + Interactive Bento Deck */}
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-12">
              {/* LEFT (6 cols): True 360° Revolving Radar & Orbital Sphere */}
              <div className="flex items-center justify-center lg:col-span-6">
                <div className="relative flex aspect-square w-full max-w-[23rem] items-center justify-center sm:max-w-[26rem]">
                  {/* 1. Rotating Conic Radar Sweep Beam */}
                  <div
                    aria-hidden
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 68%, rgba(16, 185, 129, 0.28) 96%, rgba(52, 211, 153, 0.55) 100%)",
                      animationDuration: "8s",
                    }}
                    className="ds-orbit-slow pointer-events-none absolute inset-4 rounded-full"
                  />

                  {/* 2. Outer Revolving Ring with Glowing Beacons */}
                  <div
                    aria-hidden
                    className="ds-orbit-slow pointer-events-none absolute inset-4 rounded-full border border-dashed border-emerald-400/35"
                  >
                    <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_16px_#34d399]" />
                    <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-teal-300 shadow-[0_0_16px_#2dd4bf]" />
                  </div>

                  {/* 3. Counter-Rotating Middle Orbit with 4 Language Satellites */}
                  <div
                    aria-hidden
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "22s",
                    }}
                    className="ds-orbit-slow pointer-events-none absolute inset-14 rounded-full border border-teal-400/25"
                  >
                    {langs.map((l, i) => {
                      const pos = [
                        "-top-3 left-1/2 -translate-x-1/2",
                        "top-1/2 -right-3 -translate-y-1/2",
                        "-bottom-3 left-1/2 -translate-x-1/2",
                        "top-1/2 -left-3 -translate-y-1/2",
                      ][i];
                      return (
                        <span
                          key={l.code}
                          className={cn(
                            "absolute rounded-full border border-emerald-400/40 bg-[#041410] px-2 py-0.5 text-[9px] font-black text-emerald-300 shadow-md",
                            pos,
                          )}
                        >
                          {l.code}
                        </span>
                      );
                    })}
                  </div>

                  {/* 4. SVG Circular Progress Ring */}
                  <svg
                    aria-hidden
                    viewBox="0 0 320 320"
                    className="pointer-events-none absolute inset-0 size-full -rotate-90"
                  >
                    <circle
                      cx="160"
                      cy="160"
                      r="136"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="160"
                      cy="160"
                      r="136"
                      fill="none"
                      stroke="url(#planetarium-ring-grad)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient
                        id="planetarium-ring-grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="50%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* 5. Central Pulsing AI Core Sphere */}
                  <div className="relative z-10 flex size-44 flex-col items-center justify-center rounded-full border border-emerald-400/45 bg-gradient-to-b from-[#07261E] to-[#03120E] p-5 text-center shadow-[0_0_70px_-10px_rgb(16,185,129,0.7)] sm:size-48">
                    <div
                      aria-hidden
                      className="ds-pulse-ring pointer-events-none absolute -inset-3 rounded-full border border-emerald-400/35"
                    />
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.5)]">
                      <ActiveIcon size={24} />
                    </span>
                    <span className="mt-2.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-emerald-300">
                      {`${activeStepItem.num} / 04`}
                    </span>
                    <p
                      key={`${mode}-${activeStep}`}
                      className="ds-slide-in mt-1.5 line-clamp-2 text-xs leading-snug font-extrabold text-white sm:text-sm"
                    >
                      {activeStepItem.label}
                    </p>
                  </div>

                  {/* 6. Four Diagonal Orbital Nodes (Never collide with center!) */}
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
                          "group absolute z-20 flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-left backdrop-blur-xl transition-all duration-300",
                          diagonalNodes[idx],
                          isActive
                            ? "scale-105 border-emerald-300 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.7)]"
                            : isDone
                              ? "border-emerald-400/40 bg-[#07261E]/90 text-emerald-200"
                              : "border-white/15 bg-[#041410]/90 text-white/85 hover:border-emerald-400/50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-black",
                            isActive
                              ? "bg-slate-950/15 text-slate-950"
                              : isDone
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-white/10 text-emerald-300",
                          )}
                        >
                          {isDone ? <CheckIcon size={13} /> : <Icon size={13} />}
                        </span>
                        <span className="text-xs font-black tabular-nums">
                          {num}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT (6 cols): Synchronized 2x2 Step Matrix + Languages + Privacy */}
              <div className="space-y-5 lg:col-span-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white sm:text-2xl">
                      {mode === "student"
                        ? t("studentPipelineTitle")
                        : t("companyPipelineTitle")}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-100/75 sm:text-sm">
                      {mode === "student"
                        ? t("studentPipelineDesc")
                        : t("companyPipelineDesc")}
                    </p>
                  </div>
                </div>

                {/* 2x2 Interactive Step Cards */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {steps.map(({ num, label, Icon }, idx) => {
                    const isActive = idx === activeStep;
                    const isDone = idx < activeStep;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setActiveStep(idx)}
                        className={cn(
                          "flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300",
                          isActive
                            ? "border-emerald-400 bg-gradient-to-br from-emerald-500/25 via-emerald-500/15 to-teal-500/10 shadow-[0_12px_30px_-8px_rgba(16,185,129,0.4)] -translate-y-0.5"
                            : isDone
                              ? "border-emerald-500/30 bg-white/8"
                              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "inline-flex size-10 items-center justify-center rounded-xl transition-colors",
                              isActive
                                ? "bg-gradient-to-br from-emerald-400 to-teal-400 text-slate-950 shadow-md"
                                : isDone
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/10 text-emerald-200/75",
                            )}
                          >
                            {isDone ? (
                              <CheckIcon size={18} />
                            ) : (
                              <Icon size={18} />
                            )}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums",
                              isActive
                                ? "bg-emerald-400 text-slate-950"
                                : "bg-white/8 text-emerald-200/70",
                            )}
                          >
                            {num}
                          </span>
                        </div>
                        <p className="mt-3.5 text-sm font-extrabold text-white">
                          {label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Bento Strip: 4 Languages + Privacy Shield + CTA */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-md">
                    <p className="text-xs font-extrabold text-emerald-300">
                      {t("langTitle")}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {langs.map((item) => (
                        <span
                          key={item.code}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white"
                        >
                          <span className="text-emerald-300 font-black">
                            {item.code}
                          </span>
                          <span>{item.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/12 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white">
                        {t("privacyTitle")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                        <CheckIcon size={11} />
                        {t("privacyBadge")}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-emerald-100/80">
                      {t("privacyDesc")}
                    </p>
                  </div>
                </div>

                {/* Live Metrics + Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/12 bg-white/6 px-5 py-3.5">
                  <div className="flex items-center gap-6">
                    {metrics.map((m) => (
                      <div key={m.label}>
                        <p className="text-lg font-black text-emerald-300 tabular-nums">
                          <AnimatedNumber value={m.value} />
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-100/70">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={mode === "student" ? "/register" : "/company/students"}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-md transition-transform hover:-translate-y-0.5 sm:text-sm"
                  >
                    <span>
                      {mode === "student" ? t("ctaStudent") : t("ctaCompany")}
                    </span>
                    <ArrowRightIcon size={15} />
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
