"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { LandingStats } from "@/backend/landing-stats";
import { cn } from "@/frontend/components/ds/cn";
import { AnimatedNumber } from "@/frontend/components/ds/motion";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CheckIcon,
  CodeWindowIcon,
  MessageIcon,
  SearchIcon,
  SparkIcon,
  UiUxIcon,
} from "@/frontend/components/icons";
import { Link, useRouter } from "@/i18n/navigation";

export function HeroSearch({
  placeholder,
  buttonLabel,
  quickLabel,
  tags,
  locationLabel,
  countryLabel,
}: {
  placeholder: string;
  buttonLabel: string;
  quickLabel: string;
  tags: string[];
  locationLabel?: string;
  countryLabel?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (location) params.set("location", location);
    router.push(params.size ? `/vacancies?${params}` : "/vacancies");
  }

  return (
    <div className="mt-8 w-full max-w-2xl space-y-3.5">
      <form
        onSubmit={onSubmit}
        className="border-line bg-card shadow-float focus-within:border-primary flex items-center gap-2 rounded-2xl border p-2 transition-all"
      >
        <span className="bg-primary-soft text-primary-text ml-1 inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
          <SearchIcon size={18} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="text-text placeholder:text-subtle min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm font-medium outline-none sm:text-base"
        />
        {locationLabel && (
          <select
            aria-label={locationLabel}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">{countryLabel}</option>
            <option value="Nukus">Nukus</option>
            <option value="Tashkent">Tashkent</option>
            <option value="Samarkand">Samarkand</option>
          </select>
        )}
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_-6px_rgb(5,150,105,0.55)] transition-all hover:brightness-105 active:scale-[0.98] sm:text-sm"
        >
          {buttonLabel}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-subtle font-semibold">{quickLabel}</span>
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/vacancies?q=${encodeURIComponent(tag)}`}
            className="border-line bg-card text-text hover:border-primary hover:bg-primary-soft hover:text-primary-text rounded-full border px-3.5 py-1 font-bold shadow-2xs transition-all hover:-translate-y-0.5"
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}

type TerminalTab = 0 | 1 | 2;

export function HeroTerminal({
  stats,
  labels,
}: {
  stats: LandingStats;
  labels: {
    mode1: string;
    mode2: string;
    mode3: string;
    previewTitle: string;
    previewStatus: string;
    previewMatch: string;
    liveVacancies: string;
    liveCvs: string;
    liveCompanies: string;
    cta: string;
    secondaryCta: string;
    skills: string[];
  };
}) {
  const [tab, setTab] = useState<TerminalTab>(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setTab((prev) => ((prev + 1) % 3) as TerminalTab);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const tabs: {
    id: TerminalTab;
    label: string;
    count: number;
    metricLabel: string;
    Icon: typeof SparkIcon;
  }[] = [
    {
      id: 0,
      label: labels.mode1,
      count: stats.visibleCvs,
      metricLabel: labels.liveCvs,
      Icon: SparkIcon,
    },
    {
      id: 1,
      label: labels.mode2,
      count: stats.activeVacancies,
      metricLabel: labels.liveVacancies,
      Icon: BriefcaseIcon,
    },
    {
      id: 2,
      label: labels.mode3,
      count: stats.approvedCompanies,
      metricLabel: labels.liveCompanies,
      Icon: BuildingIcon,
    },
  ];

  const totalLive = Math.max(
    stats.visibleCvs + stats.activeVacancies + stats.approvedCompanies,
    1,
  );
  const activeItem = tabs[tab];
  const barPercent =
    activeItem.count === 0
      ? 16
      : Math.max(22, Math.round((activeItem.count / totalLive) * 100));

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* BENTO 1 (5 cols): Deep Forest Obsidian Interactive AI & Live Engine */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#061A14] p-6 text-white shadow-[0_24px_60px_-15px_rgb(6,26,20,0.45)] sm:p-7 lg:col-span-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-emerald-500/20 blur-3xl"
        />

        {/* Mode Switcher */}
        <div className="relative z-10 grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/6 p-1">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold transition-all sm:text-xs",
                  active
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md"
                    : "text-emerald-100/70 hover:text-white",
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Engine Status Header */}
        <div className="relative z-10 mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
              <SparkIcon size={20} />
            </span>
            <div>
              <p className="text-sm font-extrabold text-white">
                {labels.previewTitle}
              </p>
              <p className="text-xs text-emerald-200/75">
                {labels.previewStatus}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
            <CheckIcon size={14} />
            {labels.previewMatch}
          </span>
        </div>

        {/* Active Metric Progress */}
        <div className="relative z-10 mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div
            key={tab}
            className="ds-slide-in flex items-center justify-between text-xs font-bold"
          >
            <span className="text-emerald-100/80">
              {activeItem.metricLabel}
            </span>
            <span className="text-lg font-black text-emerald-300 tabular-nums">
              <AnimatedNumber value={activeItem.count} />
            </span>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="ds-shimmer h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-all duration-500"
              style={{ width: `${barPercent}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {labels.skills.map((skill) => (
              <Link
                key={skill}
                href={`/vacancies?q=${encodeURIComponent(skill)}`}
                className="rounded-xl border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-bold text-emerald-100 transition-all hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:text-white"
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* BENTO 2 (4 cols): Live Platform Pulse Metrics */}
      <div className="border-line bg-card shadow-float flex flex-col justify-between rounded-3xl border p-6 sm:p-7 lg:col-span-4">
        <div className="space-y-3">
          <div className="border-line bg-card-cool flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3.5">
              <span className="bg-primary-soft text-primary-text inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                <BriefcaseIcon size={20} />
              </span>
              <div>
                <p className="text-subtle text-xs font-semibold">
                  {labels.liveVacancies}
                </p>
                <p className="text-text text-2xl font-black tracking-tight tabular-nums">
                  <AnimatedNumber value={stats.activeVacancies} />
                </p>
              </div>
            </div>
            <Link
              href="/vacancies"
              aria-label={labels.liveVacancies}
              className="border-line bg-card text-primary-text hover:border-primary inline-flex size-9 items-center justify-center rounded-xl border transition-colors"
            >
              <ArrowRightIcon size={15} />
            </Link>
          </div>

          <div className="border-line bg-card-cool flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3.5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
                <CodeWindowIcon size={20} />
              </span>
              <div>
                <p className="text-subtle text-xs font-semibold">
                  {labels.liveCvs}
                </p>
                <p className="text-text text-2xl font-black tracking-tight tabular-nums">
                  <AnimatedNumber value={stats.visibleCvs} />
                </p>
              </div>
            </div>
            <Link
              href="/student/cv"
              aria-label={labels.liveCvs}
              className="border-line bg-card text-primary-text hover:border-primary inline-flex size-9 items-center justify-center rounded-xl border transition-colors"
            >
              <ArrowRightIcon size={15} />
            </Link>
          </div>

          <div className="border-line bg-card-cool flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3.5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {tab === 2 ? <MessageIcon size={20} /> : <UiUxIcon size={20} />}
              </span>
              <div>
                <p className="text-subtle text-xs font-semibold">
                  {labels.liveCompanies}
                </p>
                <p className="text-text text-2xl font-black tracking-tight tabular-nums">
                  <AnimatedNumber value={stats.approvedCompanies} />
                </p>
              </div>
            </div>
            <Link
              href="/#companies"
              aria-label={labels.liveCompanies}
              className="border-line bg-card text-primary-text hover:border-primary inline-flex size-9 items-center justify-center rounded-xl border transition-colors"
            >
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* BENTO 3 (3 cols): Emerald-Teal Career & Employer Action Card */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-[0_24px_50px_-14px_rgb(5,150,105,0.45)] sm:p-7 lg:col-span-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-12 size-44 rounded-full bg-amber-300/20 blur-2xl"
        />

        <div className="relative z-10 space-y-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md">
            <BuildingIcon size={20} />
          </span>
          <h3 className="text-lg leading-snug font-black text-white">
            {`${labels.mode1} · ${labels.mode3}`}
          </h3>
          <p className="text-xs leading-relaxed text-emerald-50/90">
            {labels.previewStatus}
          </p>
        </div>

        <div className="relative z-10 mt-6 space-y-2.5">
          <Link
            href="/student/cv"
            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-emerald-950 shadow-md transition-transform hover:-translate-y-0.5"
          >
            <span>{labels.cta}</span>
            <ArrowRightIcon size={15} />
          </Link>
          <Link
            href="/vacancies"
            className="flex w-full items-center justify-between rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <span>{labels.secondaryCta}</span>
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
