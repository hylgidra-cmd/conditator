"use client";

import { useEffect, useState } from "react";
import type { FeaturedVacancy } from "@/backend/landing-stats";
import { cn } from "@/frontend/components/ds/cn";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CodeWindowIcon,
  HandshakeIcon,
  MapPinIcon,
  MegaphoneIcon,
  ResumeIcon,
  SparkIcon,
  UsersIcon,
} from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

type IndustryCard = {
  title: string;
  subtitle: string;
  query: string;
  tone: string;
  iconKey: "edu" | "fin" | "sales" | "med" | "it" | "eng";
};

function IndustryIcon({ iconKey }: { iconKey: IndustryCard["iconKey"] }) {
  if (iconKey === "edu") return <UsersIcon size={20} />;
  if (iconKey === "fin") return <HandshakeIcon size={20} />;
  if (iconKey === "sales") return <MegaphoneIcon size={20} />;
  if (iconKey === "med") return <SparkIcon size={20} />;
  if (iconKey === "it") return <CodeWindowIcon size={20} />;
  return <BuildingIcon size={20} />;
}

export function PromoBillboardClient({
  vacancies,
  workTypes,
  industries,
  labels,
}: {
  vacancies: FeaturedVacancy[];
  workTypes: Record<string, string>;
  industries: IndustryCard[];
  labels: {
    slideTabs: [string, string, string, string];
    slide1: {
      badge: string;
      title: string;
      desc: string;
      cta: string;
      alt: string;
    };
    slide2: {
      badge: string;
      title: string;
      desc: string;
    };
    slide3: {
      badge: string;
      title: string;
      desc: string;
      cta: string;
      viewAll: string;
    };
    slide4: {
      badge: string;
      title: string;
      desc: string;
      negotiable: string;
      applyBtn: string;
      viewAll: string;
      empty: string;
    };
  };
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [paused]);

  const prevSlide = () => setActiveSlide((s) => (s + 3) % 4);
  const nextSlide = () => setActiveSlide((s) => (s + 1) % 4);

  const vacancyGridClass =
    vacancies.length <= 1
      ? "grid gap-4 max-w-xl"
      : vacancies.length === 2
        ? "grid gap-4 sm:grid-cols-2"
        : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="space-y-5"
    >
      {/* Interactive Auto-Rotating Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
          {labels.slideTabs.map((tabLabel, idx) => {
            const active = activeSlide === idx;
            return (
              <button
                key={tabLabel}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] sm:text-sm",
                  active
                    ? "border-emerald-600 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-[0_10px_24px_-6px_rgb(5,150,105,0.55)]"
                    : "border-line bg-card text-subtle hover:border-primary/50 hover:text-text",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-black tabular-nums",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-primary-soft text-primary-text",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="truncate">{tabLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label={labels.slideTabs[(activeSlide + 3) % 4]}
            className="border-line bg-card text-text hover:border-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition-all active:scale-95"
          >
            <ArrowLeftIcon size={16} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label={labels.slideTabs[(activeSlide + 1) % 4]}
            className="border-line bg-card text-text hover:border-primary inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition-all active:scale-95"
          >
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Dynamic Billboard Stage */}
      <div className="border-line bg-card shadow-float relative overflow-hidden rounded-3xl border p-6 sm:p-10">
        {/* Progress indicator bar */}
        <div className="mb-8 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              aria-label={labels.slideTabs[idx]}
              onClick={() => setActiveSlide(idx)}
              className="bg-line h-1.5 cursor-pointer overflow-hidden rounded-full"
            >
              <span
                className={cn(
                  "block h-full rounded-full transition-all duration-500",
                  activeSlide === idx
                    ? "w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400"
                    : idx < activeSlide
                      ? "w-full bg-emerald-500/45"
                      : "w-0",
                )}
              />
            </button>
          ))}
        </div>

        {/* SLIDE 0: Company & Employer Advertising Billboard */}
        {activeSlide === 0 && (
          <div
            key="slide-0"
            className="ds-slide-in grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-5">
              <span className="border-primary/35 bg-primary-soft text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                <BuildingIcon size={14} />
                {labels.slide1.badge}
              </span>
              <h3 className="text-h2 text-gradient-blue font-black text-balance">
                {labels.slide1.title}
              </h3>
              <p className="text-subtle max-w-2xl text-sm leading-relaxed sm:text-base">
                {labels.slide1.desc}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/register?role=COMPANY"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_28px_-8px_rgb(5,150,105,0.6)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  <span>{labels.slide1.cta}</span>
                  <ArrowRightIcon size={16} />
                </Link>
                <Link
                  href="/company/students"
                  className="border-line bg-card-cool text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-colors"
                >
                  {labels.slide1.alt}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {industries.slice(0, 4).map((ind) => (
                <Link
                  key={ind.title}
                  href={`/vacancies?q=${encodeURIComponent(ind.query)}`}
                  className="border-line bg-card-cool hover:border-primary group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "inline-flex size-11 items-center justify-center rounded-xl text-white shadow-sm",
                      ind.tone,
                    )}
                  >
                    <IndustryIcon iconKey={ind.iconKey} />
                  </span>
                  <p className="text-text group-hover:text-primary-text mt-3 text-xs font-extrabold sm:text-sm">
                    {ind.title}
                  </p>
                  <p className="text-subtle mt-0.5 line-clamp-1 text-[11px]">
                    {ind.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 1: Universal Professions Directory */}
        {activeSlide === 1 && (
          <div key="slide-1" className="ds-slide-in space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="border-teal-500/35 bg-teal-500/12 text-teal-700 dark:text-teal-300 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                  <BriefcaseIcon size={14} />
                  {labels.slide2.badge}
                </span>
                <h3 className="text-h2 text-text mt-3 font-black text-balance">
                  {labels.slide2.title}
                </h3>
                <p className="text-subtle mt-1.5 max-w-2xl text-sm">
                  {labels.slide2.desc}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((ind) => (
                <Link
                  key={ind.title}
                  href={`/vacancies?q=${encodeURIComponent(ind.query)}`}
                  className="border-line bg-card-cool hover:border-primary group flex items-start gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md",
                      ind.tone,
                    )}
                  >
                    <IndustryIcon iconKey={ind.iconKey} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-text group-hover:text-primary-text text-sm font-extrabold transition-colors sm:text-base">
                      {ind.title}
                    </h4>
                    <p className="text-subtle mt-1 text-xs leading-snug">
                      {ind.subtitle}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SLIDE 2: AI CV Builder Promotion */}
        {activeSlide === 2 && (
          <div
            key="slide-2"
            className="ds-slide-in grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="space-y-5">
              <span className="border-emerald-500/35 bg-success-soft text-success inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                <ResumeIcon size={14} />
                {labels.slide3.badge}
              </span>
              <h3 className="text-h2 text-gradient-blue font-black text-balance">
                {labels.slide3.title}
              </h3>
              <p className="text-subtle max-w-2xl text-sm leading-relaxed sm:text-base">
                {labels.slide3.desc}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/student/cv"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_28px_-8px_rgb(5,150,105,0.6)] transition-all hover:brightness-105 active:scale-[0.98]"
                >
                  <span>{labels.slide3.cta}</span>
                  <ArrowRightIcon size={16} />
                </Link>
                <Link
                  href="/vacancies"
                  className="border-line bg-card-cool text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-bold transition-colors"
                >
                  {labels.slide3.viewAll}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-[#061A14] p-5 text-white shadow-xl">
              <div className="space-y-3">
                {industries.slice(0, 3).map((ind) => (
                  <Link
                    key={ind.title}
                    href={`/vacancies?q=${encodeURIComponent(ind.query)}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3.5 transition-all hover:border-emerald-400/50 hover:bg-white/12"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-9 items-center justify-center rounded-xl text-white",
                          ind.tone,
                        )}
                      >
                        <IndustryIcon iconKey={ind.iconKey} />
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-extrabold text-white sm:text-sm">
                          {ind.title}
                        </span>
                        <span className="block truncate text-[11px] text-emerald-200/75">
                          {ind.subtitle}
                        </span>
                      </div>
                    </div>
                    <ArrowRightIcon
                      size={15}
                      className="shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: Live Database Active Vacancies */}
        {activeSlide === 3 && (
          <div key="slide-3" className="ds-slide-in space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="border-primary/35 bg-primary-soft text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                  <SparkIcon size={14} />
                  {labels.slide4.badge}
                </span>
                <h3 className="text-h2 text-text mt-3 font-black text-balance">
                  {labels.slide4.title}
                </h3>
                <p className="text-subtle mt-1.5 text-sm">
                  {labels.slide4.desc}
                </p>
              </div>
              <Link
                href="/vacancies"
                className="border-line bg-card-cool text-primary-text hover:border-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition-colors"
              >
                <span>{labels.slide4.viewAll}</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>

            {vacancies.length === 0 ? (
              <div className="border-line bg-card-cool rounded-2xl border p-8 text-center">
                <p className="text-subtle text-sm">{labels.slide4.empty}</p>
                <Link
                  href="/vacancies"
                  className="bg-primary-soft text-primary-text hover:bg-primary/20 mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                >
                  <span>{labels.slide4.viewAll}</span>
                  <ArrowRightIcon size={14} />
                </Link>
              </div>
            ) : (
              <div className={vacancyGridClass}>
                {vacancies.map((job) => {
                  const salaryText =
                    job.salaryFrom || job.salaryTo
                      ? `${job.salaryFrom ? job.salaryFrom.toLocaleString("en-US") : ""}${job.salaryTo ? ` – ${job.salaryTo.toLocaleString("en-US")}` : ""} ${job.currency}`
                      : labels.slide4.negotiable;

                  const workTypeLabel = job.workType
                    ? (workTypes[job.workType] ?? job.workType)
                    : null;

                  return (
                    <Link
                      key={job.id}
                      href={`/vacancies/${job.id}`}
                      className="border-line bg-card-cool hover:border-primary group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="bg-primary-soft text-primary-text border-primary/25 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold">
                            <BriefcaseIcon size={12} />
                            {job.companyName}
                          </span>
                          {workTypeLabel ? (
                            <span className="border-line bg-card text-subtle rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                              {workTypeLabel}
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-text group-hover:text-primary-text mt-3.5 line-clamp-2 text-base font-extrabold transition-colors">
                          {job.title}
                        </h4>

                        {job.location ? (
                          <p className="text-subtle mt-1.5 flex items-center gap-1.5 text-xs font-medium">
                            <MapPinIcon size={13} className="text-primary-text" />
                            {job.location}
                          </p>
                        ) : null}
                      </div>

                      <div className="border-line/80 mt-5 flex items-center justify-between gap-2 border-t pt-3.5">
                        <span className="text-text text-xs font-extrabold sm:text-sm">
                          {salaryText}
                        </span>
                        <span className="text-primary-text inline-flex items-center gap-1 text-xs font-bold">
                          <span>{labels.slide4.applyBtn}</span>
                          <ArrowRightIcon size={13} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
