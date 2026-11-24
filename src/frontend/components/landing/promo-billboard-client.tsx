"use client";

import { useEffect, useState } from "react";
import type { FeaturedVacancy } from "@/backend/landing-stats";
import { cn } from "@/frontend/components/ds/cn";
import {
  ArrowRightIcon,
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
  const [spotlightMode, setSpotlightMode] = useState<0 | 1>(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setSpotlightMode((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const marqueeItems = [...industries, ...industries];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="space-y-6"
    >
      {/* 1. Infinite Auto-Scrolling Career & Industry Marquee */}
      <div className="border-line bg-card/85 shadow-soft relative overflow-hidden rounded-3xl border py-5 backdrop-blur-xl">
        <div
          aria-hidden
          className="from-card pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent sm:w-28"
        />
        <div
          aria-hidden
          className="from-card pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent sm:w-28"
        />

        <div className="ds-wave ds-wave-slow flex w-[200%] gap-4 px-4 hover:[animation-play-state:paused]">
          {marqueeItems.map((ind, idx) => (
            <Link
              key={`${ind.title}-${idx}`}
              href={`/vacancies?audience=${encodeURIComponent(ind.iconKey)}`}
              className="border-line bg-card-cool hover:border-primary group flex min-w-[17rem] flex-1 items-center gap-3.5 rounded-2xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:min-w-[19rem]"
            >
              <span
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform group-hover:scale-105",
                  ind.tone,
                )}
              >
                <IndustryIcon iconKey={ind.iconKey} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text group-hover:text-primary-text truncate text-sm font-black transition-colors">
                  {ind.title}
                </p>
                <p className="text-subtle mt-0.5 truncate text-xs">
                  {ind.subtitle}
                </p>
              </div>
              <ArrowRightIcon
                size={15}
                className="text-subtle group-hover:text-primary-text shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Asymmetric Split Bento Stage: Dark Obsidian Promo Hub + Live Vacancies Deck */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT (5 cols): Deep Forest Obsidian Interactive Promo & AI Studio Hub */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-emerald-500/30 bg-gradient-to-br from-[#041410] via-[#07221B] to-[#0A2E25] p-6 text-white shadow-[0_28px_65px_-16px_rgb(4,20,16,0.55)] sm:p-8 lg:col-span-5">
          {/* Animated orbital halo inside dark card */}
          <div
            aria-hidden
            className="ds-orbit-slow pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border border-dashed border-emerald-400/25"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-emerald-500/20 blur-3xl"
          />

          {/* Top Mode Switcher Pill */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-full border border-white/12 bg-white/8 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSpotlightMode(0)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all",
                  spotlightMode === 0
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm"
                    : "text-emerald-100/75 hover:text-white",
                )}
              >
                {labels.slideTabs[0]}
              </button>
              <button
                type="button"
                onClick={() => setSpotlightMode(1)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all",
                  spotlightMode === 1
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm"
                    : "text-emerald-100/75 hover:text-white",
                )}
              >
                {labels.slideTabs[2]}
              </button>
            </div>

            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
              {spotlightMode === 0 ? (
                <BuildingIcon size={18} />
              ) : (
                <ResumeIcon size={18} />
              )}
            </span>
          </div>

          {/* Dynamic Spotlight Content */}
          {spotlightMode === 0 ? (
            <div key="promo-employer" className="ds-slide-in relative z-10 my-7 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold text-amber-300">
                <SparkIcon size={13} />
                {labels.slide1.badge}
              </span>
              <h3 className="text-2xl leading-tight font-black tracking-tight text-white text-balance sm:text-3xl">
                {labels.slide1.title}
              </h3>
              <p className="text-sm leading-relaxed text-emerald-100/80">
                {labels.slide1.desc}
              </p>
            </div>
          ) : (
            <div key="promo-cv" className="ds-slide-in relative z-10 my-7 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/20 px-3 py-1 text-[11px] font-extrabold text-emerald-300">
                <ResumeIcon size={13} />
                {labels.slide3.badge}
              </span>
              <h3 className="text-2xl leading-tight font-black tracking-tight text-white text-balance sm:text-3xl">
                {labels.slide3.title}
              </h3>
              <p className="text-sm leading-relaxed text-emerald-100/80">
                {labels.slide3.desc}
              </p>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="relative z-10 flex flex-wrap gap-3">
            <Link
              href={spotlightMode === 0 ? "/register?role=COMPANY" : "/student/cv"}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 px-5 py-3 text-xs font-black text-slate-950 shadow-[0_10px_25px_-6px_rgb(16,185,129,0.6)] transition-all hover:-translate-y-0.5 sm:text-sm"
            >
              <span>
                {spotlightMode === 0 ? labels.slide1.cta : labels.slide3.cta}
              </span>
              <ArrowRightIcon size={15} />
            </Link>
            <Link
              href={spotlightMode === 0 ? "/company/students" : "/vacancies"}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:text-sm"
            >
              {spotlightMode === 0 ? labels.slide1.alt : labels.slide3.viewAll}
            </Link>
          </div>
        </div>

        {/* RIGHT (7 cols): Live Active Vacancies Showcase Deck */}
        <div className="border-line bg-card shadow-float flex flex-col justify-between rounded-[2rem] border p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="border-primary/35 bg-primary-soft text-primary-text inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold">
                <span className="ds-pulse-ring size-2 rounded-full bg-emerald-500" />
                {labels.slide4.badge}
              </span>
              <h3 className="text-text mt-3 text-xl font-black tracking-tight sm:text-2xl">
                {labels.slide4.title}
              </h3>
              <p className="text-subtle mt-1 text-xs sm:text-sm">
                {labels.slide4.desc}
              </p>
            </div>

            <Link
              href="/vacancies"
              className="border-line bg-card-cool text-primary-text hover:border-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold transition-all hover:-translate-y-0.5"
            >
              <span>{labels.slide4.viewAll}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          {vacancies.length === 0 ? (
            <div className="border-line bg-card-cool my-6 rounded-2xl border p-8 text-center">
              <p className="text-subtle text-sm">{labels.slide4.empty}</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {vacancies.slice(0, 4).map((job) => {
                const salaryText =
                  job.salaryFrom || job.salaryTo
                    ? `${job.salaryFrom ? job.salaryFrom.toLocaleString("en-US") : ""}${job.salaryTo ? ` – ${job.salaryTo.toLocaleString("en-US")}` : ""} ${job.currency}`
                    : labels.slide4.negotiable;

                const workTypeLabel = job.workType
                  ? (workTypes[job.workType] ?? job.workType)
                  : null;
                const companyLabel = job.companyName?.trim() || "Candidator";
                const initial = companyLabel.slice(0, 1).toUpperCase();

                return (
                  <Link
                    key={job.id}
                    href={`/vacancies/${job.id}`}
                    className="border-line bg-card-cool/85 hover:border-primary group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {job.hasLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/companies/${job.companyId}/logo`}
                              alt={companyLabel}
                              className="size-9 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-black/5"
                            />
                          ) : (
                            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-xs font-black text-white shadow-xs">
                              {initial}
                            </span>
                          )}
                          <span className="text-text truncate text-xs font-extrabold">
                            {companyLabel}
                          </span>
                        </div>

                        {workTypeLabel ? (
                          <span className="border-primary/25 bg-primary-soft text-primary-text shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold">
                            {workTypeLabel}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-text group-hover:text-primary-text mt-3.5 line-clamp-2 text-base font-black transition-colors">
                        {job.title}
                      </h4>

                      {job.location ? (
                        <p className="text-subtle mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                          <MapPinIcon size={13} className="text-primary-text" />
                          {job.location}
                        </p>
                      ) : null}
                    </div>

                    <div className="border-line/80 mt-5 flex items-center justify-between gap-2 border-t pt-3.5">
                      <span className="text-text text-xs font-black sm:text-sm">
                        {salaryText}
                      </span>
                      <span className="bg-primary text-on-primary inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-transform group-hover:translate-x-0.5">
                        <span>{labels.slide4.applyBtn}</span>
                        <ArrowRightIcon size={12} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick Category Pills Bar */}
          <div className="border-line/70 mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <span className="text-subtle text-xs font-bold">
              {`${labels.slide2.badge}:`}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {industries.slice(0, 4).map((ind) => (
                <Link
                  key={ind.title}
                  href={`/vacancies?audience=${encodeURIComponent(ind.iconKey)}`}
                  className="border-line bg-card hover:border-primary hover:text-primary-text rounded-full border px-3 py-1 text-[11px] font-bold transition-colors"
                >
                  {ind.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
