"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useMemo, useState } from "react";
import { postJson, requestJson } from "@/backend/client/api";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./vacancies-explorer.module.css";

export type ExplorerWorkType =
  | "FULL_TIME"
  | "PART_TIME"
  | "REMOTE"
  | "INTERNSHIP";

export type ExplorerVacancyItem = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyHasLogo: boolean;
  location: string | null;
  regionKey: string;
  workType: ExplorerWorkType | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  currency: string;
  rawText: string | null;
  skills: string[];
  createdAtMs: number;
  createdDateLabel: string;
  expiresDateLabel: string | null;
  matchScore: number;
  isAudienceMatch: boolean;
};

export type StudentApplyContext = {
  isAuthenticated: boolean;
  isStudent: boolean;
  canApply: boolean;
  studentCvs: Array<{
    id: string;
    title: string;
    isPaid: boolean;
  }>;
  appliedVacancyIds: string[];
};

export type VacanciesExplorerProps = {
  vacancies: ExplorerVacancyItem[];
  initialSavedIds: string[];
  initialQuery: string;
  initialRegion: string;
  initialWorkType: string;
  initialSort: string;
  initialOnlySaved: boolean;
  applyContext: StudentApplyContext;
};

type SortKey = "match" | "latest" | "salary" | "saved";

const WORK_TYPE_ORDER: ExplorerWorkType[] = [
  "FULL_TIME",
  "REMOTE",
  "INTERNSHIP",
  "PART_TIME",
];

const DEFAULT_REGIONS = [
  "Toshkent",
  "Nukus",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Fargʻona",
  "Namangan",
  "Xorazm",
  "Qashqadaryo",
  "Navoiy",
];

function formatNumberSpaced(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function VacancyCategoryIcon({ title, skills }: { title: string; skills: string[] }) {
  const hay = `${title} ${skills.join(" ")}`.toLowerCase();

  if (/frontend|react|vue|web|html|javascript|typescript|mobile|flutter/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }
  if (/backend|data|sql|python|node|java|devops|tizim|server|baza/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    );
  }
  if (/dizayn|design|ui|ux|figma|grafik|3d/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    );
  }
  if (/marketing|smm|target|reklama|kopirayt|kontent|pr/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    );
  }
  if (/hr|kadr|rekrut|o'qituv|mentor|psixolog/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (/menejer|product|project|moliya|buxgalter|iqtisod|tahlil|sotuv/.test(hay)) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function VacanciesExplorer({
  vacancies,
  initialSavedIds,
  initialQuery,
  initialRegion,
  initialWorkType,
  initialSort,
  initialOnlySaved,
  applyContext,
}: VacanciesExplorerProps) {
  const t = useTranslations("VacanciesExplorer");
  const router = useRouter();

  const maxSalaryCeiling = useMemo(() => {
    let highest = 20_000_000;
    for (const v of vacancies) {
      if (v.salaryTo && v.salaryTo > highest) highest = v.salaryTo;
      if (v.salaryFrom && v.salaryFrom > highest) highest = v.salaryFrom;
    }
    return Math.ceil(highest / 5_000_000) * 5_000_000;
  }, [vacancies]);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [headerRegion, setHeaderRegion] = useState(initialRegion);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<ExplorerWorkType[]>(
    initialWorkType && WORK_TYPE_ORDER.includes(initialWorkType as ExplorerWorkType)
      ? [initialWorkType as ExplorerWorkType]
      : [],
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialRegion ? [initialRegion] : [],
  );
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [salaryMax, setSalaryMax] = useState<number>(maxSalaryCeiling);
  const [sortBy, setSortBy] = useState<SortKey>(
    initialOnlySaved
      ? "saved"
      : initialSort === "latest" || initialSort === "salary"
        ? initialSort
        : "match",
  );

  // Accordion UI states
  const [openWorkTypeSec, setOpenWorkTypeSec] = useState(true);
  const [openRegionSec, setOpenRegionSec] = useState(true);
  const [openSalarySec, setOpenSalarySec] = useState(true);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // Bookmarks, Selection & Apply Modal
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(initialSavedIds),
  );
  const [busyBookmarkId, setBusyBookmarkId] = useState<string | null>(null);
  const [appliedSet, setAppliedSet] = useState<Set<string>>(
    () => new Set(applyContext.appliedVacancyIds),
  );
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    vacancies[0]?.id ?? null,
  );
  const [applyModalVacancy, setApplyModalVacancy] =
    useState<ExplorerVacancyItem | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string>(
    applyContext.studentCvs.find((c) => c.isPaid)?.id ??
      applyContext.studentCvs[0]?.id ??
      "",
  );
  const [applyNote, setApplyNote] = useState("");
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Dynamic Work-Type & Region Counts (from active vacancies)
  const workTypeCounts = useMemo(() => {
    const map: Record<ExplorerWorkType, number> = {
      FULL_TIME: 0,
      REMOTE: 0,
      INTERNSHIP: 0,
      PART_TIME: 0,
    };
    for (const v of vacancies) {
      if (v.workType && v.workType in map) {
        map[v.workType] += 1;
      }
    }
    return map;
  }, [vacancies]);

  const regionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of DEFAULT_REGIONS) counts.set(r, 0);
    for (const v of vacancies) {
      if (v.regionKey) {
        counts.set(v.regionKey, (counts.get(v.regionKey) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
  }, [vacancies]);

  const visibleRegions = showAllRegions
    ? regionCounts
    : regionCounts.slice(0, 5);

  // Filtered & Sorted Vacancies
  const filteredVacancies = useMemo(() => {
    const qNorm = appliedQuery.trim().toLowerCase();

    const list = vacancies.filter((v) => {
      if (sortBy === "saved" && !savedSet.has(v.id)) return false;

      if (qNorm) {
        const hay =
          `${v.title} ${v.companyName} ${v.skills.join(" ")} ${v.rawText ?? ""}`.toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }

      if (selectedWorkTypes.length > 0) {
        if (!v.workType || !selectedWorkTypes.includes(v.workType)) return false;
      }

      if (selectedRegions.length > 0) {
        const locLower = (v.location ?? "").toLowerCase();
        const matchesRegion = selectedRegions.some(
          (reg) =>
            v.regionKey.toLowerCase() === reg.toLowerCase() ||
            locLower.includes(reg.toLowerCase()),
        );
        if (!matchesRegion) return false;
      }

      if (salaryMin > 0) {
        const top = v.salaryTo ?? v.salaryFrom ?? 0;
        if (top > 0 && top < salaryMin) return false;
        if (top === 0) return false;
      }

      if (salaryMax < maxSalaryCeiling) {
        const low = v.salaryFrom ?? v.salaryTo ?? 0;
        if (low > salaryMax) return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sortBy === "latest") {
      sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
    } else if (sortBy === "salary") {
      sorted.sort(
        (a, b) =>
          (b.salaryTo ?? b.salaryFrom ?? 0) - (a.salaryTo ?? a.salaryFrom ?? 0),
      );
    } else {
      sorted.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return b.createdAtMs - a.createdAtMs;
      });
    }
    return sorted;
  }, [
    vacancies,
    appliedQuery,
    selectedWorkTypes,
    selectedRegions,
    salaryMin,
    salaryMax,
    maxSalaryCeiling,
    sortBy,
    savedSet,
  ]);

  const selectedVacancy = useMemo(() => {
    if (filteredVacancies.length === 0) return null;
    return (
      filteredVacancies.find((v) => v.id === selectedVacancyId) ??
      filteredVacancies[0]
    );
  }, [filteredVacancies, selectedVacancyId]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setAppliedQuery(searchInput);
    if (headerRegion) {
      setSelectedRegions([headerRegion]);
    } else {
      setSelectedRegions([]);
    }
  }

  function handleQuickPill(wt: ExplorerWorkType | "ALL") {
    if (wt === "ALL") {
      setSelectedWorkTypes([]);
    } else {
      setSelectedWorkTypes((prev) =>
        prev.length === 1 && prev[0] === wt ? [] : [wt],
      );
    }
  }

  function toggleWorkTypeCheckbox(wt: ExplorerWorkType) {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt],
    );
  }

  function toggleRegionCheckbox(reg: string) {
    setSelectedRegions((prev) => {
      const next = prev.includes(reg)
        ? prev.filter((x) => x !== reg)
        : [...prev, reg];
      setHeaderRegion(next.length === 1 ? next[0] : "");
      return next;
    });
  }

  function resetAllFilters() {
    setSearchInput("");
    setAppliedQuery("");
    setHeaderRegion("");
    setSelectedWorkTypes([]);
    setSelectedRegions([]);
    setSalaryMin(0);
    setSalaryMax(maxSalaryCeiling);
    setSortBy("match");
  }

  const hasAnyActiveFilter =
    Boolean(appliedQuery.trim()) ||
    selectedWorkTypes.length > 0 ||
    selectedRegions.length > 0 ||
    salaryMin > 0 ||
    salaryMax < maxSalaryCeiling ||
    sortBy === "saved";

  async function toggleBookmark(vacancyId: string) {
    if (!applyContext.isAuthenticated) {
      router.push(`/login?next=/vacancies/${vacancyId}`);
      return;
    }
    if (busyBookmarkId) return;

    const currentlySaved = savedSet.has(vacancyId);
    setBusyBookmarkId(vacancyId);
    setSavedSet((prev) => {
      const copy = new Set(prev);
      if (currentlySaved) copy.delete(vacancyId);
      else copy.add(vacancyId);
      return copy;
    });

    const res = await requestJson(
      currentlySaved ? "DELETE" : "POST",
      `/api/vacancies/${encodeURIComponent(vacancyId)}/bookmark`,
    );
    setBusyBookmarkId(null);

    if (!res.ok) {
      setSavedSet((prev) => {
        const copy = new Set(prev);
        if (currentlySaved) copy.add(vacancyId);
        else copy.delete(vacancyId);
        return copy;
      });
    }
  }

  function formatSalary(v: ExplorerVacancyItem): string {
    const unit =
      v.currency.toUpperCase() === "UZS" ? t("currencySom") : v.currency;
    if (v.salaryFrom && v.salaryTo) {
      return `${formatNumberSpaced(v.salaryFrom)} – ${formatNumberSpaced(v.salaryTo)} ${unit}`;
    }
    if (v.salaryFrom) {
      return `${formatNumberSpaced(v.salaryFrom)}+ ${unit}`;
    }
    if (v.salaryTo) {
      return `${formatNumberSpaced(v.salaryTo)} ${unit}`;
    }
    return t("salaryNegotiable");
  }

  function openApplyAction(v: ExplorerVacancyItem) {
    if (!applyContext.isAuthenticated) {
      router.push(`/login?next=/vacancies/${v.id}`);
      return;
    }
    if (!applyContext.isStudent) {
      router.push(`/vacancies/${v.id}`);
      return;
    }
    setApplyError(null);
    setApplyNote("");
    setApplyModalVacancy(v);
  }

  async function handleSubmitApplication(e: FormEvent) {
    e.preventDefault();
    if (!applyModalVacancy || !selectedCvId || submittingApply) return;

    setSubmittingApply(true);
    setApplyError(null);
    const res = await postJson<{ ok: boolean }>(
      `/api/vacancies/${encodeURIComponent(applyModalVacancy.id)}/apply`,
      {
        cvId: selectedCvId,
        note: applyNote.trim() || undefined,
      },
    );
    setSubmittingApply(false);

    if (!res.ok) {
      setApplyError(t(`applyErrors.${res.error}` as "applyErrors.DEFAULT") || t("applyErrors.DEFAULT"));
      return;
    }

    setAppliedSet((prev) => {
      const next = new Set(prev);
      next.add(applyModalVacancy.id);
      return next;
    });
    setApplyModalVacancy(null);
    router.refresh();
  }

  const maxWorkTypeCount = Math.max(
    1,
    ...Object.values(workTypeCounts),
  );

  const paidCvs = applyContext.studentCvs.filter((c) => c.isPaid);

  return (
    <div className={`${styles.stage} font-ui`}>
      <div className="mx-auto max-w-[1400px] px-4 pt-5 pb-16 sm:px-6 lg:px-10 lg:pt-7">
        {/* ================= HERO BANNER + 3D CRYSTAL BRIEFCASE ================= */}
        <section className={styles.heroWrap}>
          <div aria-hidden className={styles.heroArtwork} />
          <div aria-hidden className={styles.heroScrim} />

          {/* Animated 3D Emerald Orbit Ring around Briefcase */}
          <svg
            aria-hidden
            viewBox="0 0 420 260"
            className={`${styles.orbitOverlay} hidden md:block`}
          >
            <defs>
              <linearGradient id="vacOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#34eab0" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <g transform="rotate(-17 210 132)">
              <ellipse
                cx="210"
                cy="132"
                rx="178"
                ry="54"
                fill="none"
                stroke="url(#vacOrbitGrad)"
                strokeWidth="1.6"
              />
              <ellipse
                cx="210"
                cy="132"
                rx="178"
                ry="54"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="2.4"
                strokeLinecap="round"
                className={styles.orbitDash}
              />
            </g>
          </svg>

          <div className="relative z-10 flex min-h-[216px] flex-col justify-center px-6 pt-8 pb-11 sm:min-h-[264px] sm:px-10 lg:min-h-[296px] lg:px-12">
            <div className="max-w-lg">
              <h1 className="text-[30px] leading-[1.12] font-extrabold tracking-tight text-[#0b2017] sm:text-[40px] lg:text-[44px] dark:text-[#f4fbf8]">
                {t("heroTitleLine1")}
                <br />
                {t("heroTitleLine2")}
              </h1>
              <p className="mt-2.5 text-sm font-medium text-[#48685b] sm:text-base dark:text-[#9ec5b4]">
                {t("heroSubtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* ================= SEARCH BAR & QUICK FILTER PILLS ================= */}
        <section className={`${styles.searchDock} -mt-5 relative z-20 mx-1 p-3.5 sm:mx-3 sm:p-4`}>
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 gap-2.5 md:grid-cols-[1.45fr_0.95fr_auto]"
          >
            {/* Job or company input */}
            <div className="relative flex items-center">
              <svg
                aria-hidden
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3.5 text-[#5b7a6d] dark:text-[#8eb5a4]"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setAppliedQuery(e.target.value);
                }}
                placeholder={t("searchPlaceholder")}
                className="h-11 w-full rounded-xl border border-[#d2e8dd] bg-[#f7fcfa] pr-3.5 pl-10 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5c42] dark:bg-[#082218] dark:text-white dark:placeholder:text-[#7fa896] dark:focus:border-[#34eab0]"
              />
            </div>

            {/* Region select */}
            <div className="relative flex items-center">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3.5 text-[#5b7a6d] dark:text-[#8eb5a4]"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                value={headerRegion}
                onChange={(e) => {
                  const val = e.target.value;
                  setHeaderRegion(val);
                  setSelectedRegions(val ? [val] : []);
                }}
                aria-label={t("regionPlaceholder")}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#d2e8dd] bg-[#f7fcfa] pr-9 pl-10 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1e5c42] dark:bg-[#082218] dark:text-white dark:focus:border-[#34eab0]"
              >
                <option value="">{t("regionPlaceholder")}</option>
                {regionCounts.map(([reg]) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                width="13"
                height="13"
                viewBox="0 0 12 12"
                className="pointer-events-none absolute right-3.5 text-[#5b7a6d] dark:text-[#8eb5a4]"
              >
                <path
                  d="M3 4.5 6 7.5 9 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </div>

            {/* Search button */}
            <button
              type="submit"
              className={`${styles.ctaBtn} h-11 cursor-pointer px-7 text-sm`}
            >
              {t("searchBtn")}
            </button>
          </form>

          {/* Quick Filter Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickPill("ALL")}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-extrabold transition ${
                selectedWorkTypes.length === 0
                  ? "border border-[#a8e2c8] bg-[#dcf6ea] text-[#096c45] dark:border-[#24805a] dark:bg-[#11422e] dark:text-[#34eab0]"
                  : "border border-[#d7ebe1] bg-[#f7fcfa] text-[#355447] hover:border-[#0e935f]/45 dark:border-[#1c563e] dark:bg-[#092117] dark:text-[#b4decb]"
              }`}
            >
              {t("pillAll")}
            </button>

            <button
              type="button"
              onClick={() => handleQuickPill("REMOTE")}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
                selectedWorkTypes.length === 1 &&
                selectedWorkTypes[0] === "REMOTE"
                  ? "border border-[#a8e2c8] bg-[#dcf6ea] text-[#096c45] dark:border-[#24805a] dark:bg-[#11422e] dark:text-[#34eab0]"
                  : "border border-[#d7ebe1] bg-[#f7fcfa] text-[#355447] hover:border-[#0e935f]/45 dark:border-[#1c563e] dark:bg-[#092117] dark:text-[#b4decb]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="12" x="3" y="4" rx="2" />
                <line x1="2" x2="22" y1="20" y2="20" />
              </svg>
              <span>{t("workTypes.REMOTE")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPill("INTERNSHIP")}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
                selectedWorkTypes.length === 1 &&
                selectedWorkTypes[0] === "INTERNSHIP"
                  ? "border border-[#a8e2c8] bg-[#dcf6ea] text-[#096c45] dark:border-[#24805a] dark:bg-[#11422e] dark:text-[#34eab0]"
                  : "border border-[#d7ebe1] bg-[#f7fcfa] text-[#355447] hover:border-[#0e935f]/45 dark:border-[#1c563e] dark:bg-[#092117] dark:text-[#b4decb]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
              </svg>
              <span>{t("workTypes.INTERNSHIP")}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPill("FULL_TIME")}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
                selectedWorkTypes.length === 1 &&
                selectedWorkTypes[0] === "FULL_TIME"
                  ? "border border-[#a8e2c8] bg-[#dcf6ea] text-[#096c45] dark:border-[#24805a] dark:bg-[#11422e] dark:text-[#34eab0]"
                  : "border border-[#d7ebe1] bg-[#f7fcfa] text-[#355447] hover:border-[#0e935f]/45 dark:border-[#1c563e] dark:bg-[#092117] dark:text-[#b4decb]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="7" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>{t("workTypes.FULL_TIME")}</span>
            </button>

            {hasAnyActiveFilter ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="ml-auto cursor-pointer text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
              >
                {t("clearFilters")}
              </button>
            ) : null}
          </div>
        </section>

        {/* ================= MAIN 3-COLUMN WORKSPACE ================= */}
        <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[238px_minmax(0,1fr)_306px] xl:grid-cols-[252px_minmax(0,1fr)_326px]">
          {/* ---------- COLUMN 1: LEFT FILTERS SIDEBAR ---------- */}
          <aside className={`${styles.panel} p-4 sm:p-5`}>
            <div className="flex items-center justify-between border-b border-[#e2f0e9] pb-3 dark:border-[#144330]">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <svg
                  aria-hidden
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  className="text-[#0c8a58] dark:text-[#34eab0]"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>{t("filtersTitle")}</span>
              </div>
            </div>

            {/* Filter 1: Ish turi */}
            <div className="border-b border-[#e2f0e9] py-3.5 dark:border-[#144330]">
              <button
                type="button"
                onClick={() => setOpenWorkTypeSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-extrabold"
              >
                <span className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#0c8a58] dark:text-[#34eab0]"
                  >
                    <rect width="20" height="14" x="2" y="7" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  {t("workTypeTitle")}
                </span>
                <span className="text-[#5c7a6e] dark:text-[#8eb5a4]">
                  {openWorkTypeSec ? "⌃" : "⌄"}
                </span>
              </button>

              {openWorkTypeSec ? (
                <div className="mt-3 space-y-2">
                  {WORK_TYPE_ORDER.map((wt) => {
                    const checked = selectedWorkTypes.includes(wt);
                    return (
                      <label
                        key={wt}
                        onClick={() => toggleWorkTypeCheckbox(wt)}
                        className="flex cursor-pointer items-center justify-between gap-2 text-xs select-none"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex size-4 items-center justify-center rounded border text-[10px] font-bold transition ${
                              checked
                                ? "border-[#0e935f] bg-[#0e935f] text-white dark:border-[#24d28e] dark:bg-[#24d28e] dark:text-[#042417]"
                                : "border-[#b8d4c6] bg-white dark:border-[#25644a] dark:bg-[#071d14]"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="font-semibold text-[#234336] dark:text-[#d5f2e4]">
                            {t(`workTypes.${wt}`)}
                          </span>
                        </span>
                        <span className="text-[11px] font-medium text-[#648276] dark:text-[#88b2a0]">
                          ({workTypeCounts[wt]})
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Filter 2: Hudud */}
            <div className="border-b border-[#e2f0e9] py-3.5 dark:border-[#144330]">
              <button
                type="button"
                onClick={() => setOpenRegionSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-extrabold"
              >
                <span className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#0c8a58] dark:text-[#34eab0]"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {t("regionTitle")}
                </span>
                <span className="text-[#5c7a6e] dark:text-[#8eb5a4]">
                  {openRegionSec ? "⌃" : "⌄"}
                </span>
              </button>

              {openRegionSec ? (
                <div className="mt-3 space-y-2">
                  {visibleRegions.map(([reg, count]) => {
                    const checked = selectedRegions.includes(reg);
                    return (
                      <label
                        key={reg}
                        onClick={() => toggleRegionCheckbox(reg)}
                        className="flex cursor-pointer items-center justify-between gap-2 text-xs select-none"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex size-4 items-center justify-center rounded border text-[10px] font-bold transition ${
                              checked
                                ? "border-[#0e935f] bg-[#0e935f] text-white dark:border-[#24d28e] dark:bg-[#24d28e] dark:text-[#042417]"
                                : "border-[#b8d4c6] bg-white dark:border-[#25644a] dark:bg-[#071d14]"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="font-semibold text-[#234336] dark:text-[#d5f2e4]">
                            {reg}
                          </span>
                        </span>
                        <span className="text-[11px] font-medium text-[#648276] dark:text-[#88b2a0]">
                          ({count})
                        </span>
                      </label>
                    );
                  })}

                  {regionCounts.length > 5 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllRegions((v) => !v)}
                      className="mt-1 inline-flex cursor-pointer items-center gap-1 pt-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                    >
                      <span>
                        {showAllRegions ? t("showLess") : t("showMore")}
                      </span>
                      <span aria-hidden>{showAllRegions ? "⌃" : "⌄"}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Filter 3: Maosh (so'm/oy) */}
            <div className="pt-3.5">
              <button
                type="button"
                onClick={() => setOpenSalarySec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-extrabold"
              >
                <span className="flex items-center gap-2">
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#0c8a58] dark:text-[#34eab0]"
                  >
                    <rect width="20" height="12" x="2" y="6" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                  {t("salaryTitle")}
                </span>
                <span className="text-[#5c7a6e] dark:text-[#8eb5a4]">
                  {openSalarySec ? "⌃" : "⌄"}
                </span>
              </button>

              {openSalarySec ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="mb-1 block text-[10.5px] font-semibold text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("salaryFrom")}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberSpaced(salaryMin)}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/\D/g, "")) || 0;
                          setSalaryMin(Math.min(num, salaryMax));
                        }}
                        className="h-9 w-full rounded-lg border border-[#cfe6da] bg-[#f7fcfa] px-2.5 text-xs font-bold outline-none focus:border-[#0e935f] dark:border-[#1e5c42] dark:bg-[#082117] dark:text-white"
                      />
                    </div>

                    <div>
                      <span className="mb-1 block text-[10.5px] font-semibold text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("salaryTo")}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberSpaced(salaryMax)}
                        onChange={(e) => {
                          const num =
                            Number(e.target.value.replace(/\D/g, "")) ||
                            maxSalaryCeiling;
                          setSalaryMax(
                            Math.max(salaryMin, Math.min(num, maxSalaryCeiling)),
                          );
                        }}
                        className="h-9 w-full rounded-lg border border-[#cfe6da] bg-[#f7fcfa] px-2.5 text-xs font-bold outline-none focus:border-[#0e935f] dark:border-[#1e5c42] dark:bg-[#082117] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={0}
                      max={maxSalaryCeiling}
                      step={500_000}
                      value={salaryMin}
                      aria-label={t("salaryFrom")}
                      onChange={(e) =>
                        setSalaryMin(Math.min(Number(e.target.value), salaryMax))
                      }
                      className="w-full cursor-pointer accent-[#0e935f] dark:accent-[#27eba0]"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          {/* ---------- COLUMN 2: CENTER VACANCIES 2-COL GRID ---------- */}
          <section className="space-y-3.5">
            {/* Count + Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-extrabold tracking-tight sm:text-[15px]">
                {t("vacanciesCount", { count: filteredVacancies.length })}
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#5b796d] dark:text-[#8eb5a4]">
                  {t("sortLabel")}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label={t("sortLabel")}
                  className="h-8 cursor-pointer rounded-lg border border-[#d2e8dd] bg-white px-2.5 text-xs font-bold outline-none focus:border-[#0e935f] dark:border-[#1e5c42] dark:bg-[#082218] dark:text-[#e6f9f0]"
                >
                  <option value="match">{t("sortRelevant")}</option>
                  <option value="latest">{t("sortLatest")}</option>
                  <option value="salary">{t("sortSalary")}</option>
                  {applyContext.isAuthenticated ? (
                    <option value="saved">
                      {t("sortSaved")} ({savedSet.size})
                    </option>
                  ) : null}
                </select>
              </div>
            </div>

            {filteredVacancies.length === 0 ? (
              <div className={`${styles.panel} px-6 py-14 text-center`}>
                <p className="text-sm font-bold">{t("emptyTitle")}</p>
                <p className="mt-1 text-xs text-[#59776b] dark:text-[#8eb5a4]">
                  {t("emptyHint")}
                </p>
                {hasAnyActiveFilter ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className={`${styles.ctaBtn} mt-4 h-9 cursor-pointer px-4 text-xs`}
                  >
                    {t("clearFilters")}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {filteredVacancies.map((v) => {
                  const isSelected = selectedVacancy?.id === v.id;
                  const isSaved = savedSet.has(v.id);

                  return (
                    <article
                      key={v.id}
                      onClick={() => setSelectedVacancyId(v.id)}
                      className={`${styles.vacancyCard} ${
                        isSelected ? styles.vacancyCardSelected : ""
                      } flex cursor-pointer flex-col justify-between p-4`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#c9e8d8] bg-[#e6f7ef] text-[#0b8455] dark:border-[#1f6548] dark:bg-[#0f3827] dark:text-[#34eab0]">
                              <VacancyCategoryIcon
                                title={v.title}
                                skills={v.skills}
                              />
                            </span>
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-[14.5px] leading-snug font-extrabold tracking-tight">
                                {v.title}
                              </h3>
                              <p className="mt-0.5 truncate text-[11.5px] font-semibold text-[#58766a] dark:text-[#8eb5a4]">
                                {v.companyName}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={busyBookmarkId === v.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void toggleBookmark(v.id);
                            }}
                            aria-label={t("bookmarkAria")}
                            className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition ${
                              isSaved
                                ? "text-[#0c8a58] dark:text-[#34eab0]"
                                : "text-[#6d8c80] hover:text-[#0c8a58] dark:text-[#7da896] dark:hover:text-[#34eab0]"
                            }`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill={isSaved ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-3.5 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-[#49685b] dark:text-[#b2d8c7]">
                            <svg
                              aria-hidden
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                            >
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate font-medium">
                              {v.location?.trim() || t("workTypes.REMOTE")}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                            <svg
                              aria-hidden
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                            >
                              <rect width="20" height="12" x="2" y="6" rx="2" />
                              <circle cx="12" cy="12" r="2" />
                            </svg>
                            <span className="truncate tabular-nums">
                              {formatSalary(v)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/vacancies/${v.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`${styles.cardActionBtn} mt-4 h-9 w-full text-xs`}
                      >
                        <span>{t("detailsBtn")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- COLUMN 3: RIGHT INSIGHTS & SELECTED PREVIEW ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-[88px]">
            {/* Card 1: Ish turi bo'yicha Bar Chart */}
            <section className={`${styles.panel} p-4 sm:p-5`}>
              <h2 className="text-sm font-extrabold tracking-tight">
                {t("byWorkTypeTitle")}
              </h2>

              <div className="mt-3.5 space-y-2.5">
                {WORK_TYPE_ORDER.map((wt) => {
                  const count = workTypeCounts[wt];
                  const widthPct =
                    count === 0
                      ? 4
                      : Math.max(10, Math.round((count / maxWorkTypeCount) * 100));
                  return (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => handleQuickPill(wt)}
                      className="grid w-full cursor-pointer grid-cols-[92px_1fr_34px] items-center gap-2.5 text-left text-xs transition hover:opacity-85"
                    >
                      <span className="truncate font-semibold text-[#38574a] dark:text-[#b9dfd0]">
                        {t(`workTypes.${wt}`)}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-[#e4f3ec] dark:bg-[#0d3022]">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-[#25d98e] to-[#0ea368] transition-all duration-500 dark:from-[#34eab0] dark:to-[#10b981]"
                        />
                      </div>
                      <span className="text-right font-extrabold tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Card 2: Tanlangan vakansiya (Selected Vacancy Preview) */}
            {selectedVacancy ? (
              <section className={`${styles.panel} p-5`}>
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0c8454] dark:text-[#34eab0]">
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="20" height="14" x="2" y="7" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>{t("selectedTitle")}</span>
                </div>

                <Link
                  href={`/vacancies/${selectedVacancy.id}`}
                  className="mt-2.5 block text-lg leading-snug font-extrabold tracking-tight hover:text-[#0c8454] dark:hover:text-[#34eab0]"
                >
                  {selectedVacancy.title}
                </Link>
                <p className="mt-0.5 text-xs font-bold text-[#557467] dark:text-[#92bba9]">
                  {selectedVacancy.companyName}
                </p>

                <dl className="mt-4 space-y-2 border-y border-[#e2f0e9] py-3.5 text-xs dark:border-[#144330]">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="font-semibold">
                      {selectedVacancy.location?.trim() || t("workTypes.REMOTE")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <rect width="20" height="12" x="2" y="6" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span className="font-extrabold tabular-nums">
                      {formatSalary(selectedVacancy)}
                    </span>
                  </div>

                  {selectedVacancy.workType ? (
                    <div className="flex items-center gap-2">
                      <svg
                        aria-hidden
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span className="font-semibold">
                        {t(`workTypes.${selectedVacancy.workType}`)}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 text-[#567468] dark:text-[#96beac]">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>
                      {selectedVacancy.expiresDateLabel
                        ? t("deadlineLabel", {
                            date: selectedVacancy.expiresDateLabel,
                          })
                        : t("postedLabel", {
                            date: selectedVacancy.createdDateLabel,
                          })}
                    </span>
                  </div>
                </dl>

                {selectedVacancy.rawText ? (
                  <p className="mt-3.5 line-clamp-4 text-xs leading-relaxed text-[#466558] dark:text-[#a8cfbe]">
                    {selectedVacancy.rawText}
                  </p>
                ) : null}

                {selectedVacancy.skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedVacancy.skills.slice(0, 5).map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg border border-[#cde6d9] bg-[#f3fbf7] px-2 py-0.5 text-[11px] font-bold text-[#1d4535] dark:border-[#1d5b41] dark:bg-[#0b281c] dark:text-[#bfe8d6]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex items-center gap-2.5">
                  {appliedSet.has(selectedVacancy.id) ? (
                    <div className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#b4e8cd] bg-[#e3f7ec] text-xs font-extrabold text-[#0b7e50] dark:border-[#1e6a4a] dark:bg-[#0e3626] dark:text-[#4ade9b]">
                      <span>✓ {t("alreadyAppliedBtn")}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openApplyAction(selectedVacancy)}
                      className={`${styles.ctaBtn} h-10 flex-1 cursor-pointer px-4 text-xs`}
                    >
                      <svg
                        aria-hidden
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" x2="11" y1="2" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>{t("applyBtn")}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busyBookmarkId === selectedVacancy.id}
                    onClick={() => void toggleBookmark(selectedVacancy.id)}
                    aria-label={t("bookmarkAria")}
                    className={`inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition ${
                      savedSet.has(selectedVacancy.id)
                        ? "border-[#0e935f] bg-[#e5f7ee] text-[#0b8051] dark:border-[#34eab0] dark:bg-[#103d2a] dark:text-[#34eab0]"
                        : "border-[#d2e8dd] bg-[#f7fcfa] text-[#456457] hover:border-[#0e935f] dark:border-[#1e5c42] dark:bg-[#082218] dark:text-[#b4decb]"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={
                        savedSet.has(selectedVacancy.id)
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </button>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {/* ================= REAL FULL-STACK APPLY MODAL ================= */}
      {applyModalVacancy ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={applyModalVacancy.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApplyModalVacancy(null);
          }}
        >
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#cce7da] bg-white p-6 text-[#0d2119] shadow-2xl sm:p-7 dark:border-[#227352]/60 dark:bg-[#061b13] dark:text-[#effaf4]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">
                  {applyModalVacancy.title}
                </h2>
                <p className="mt-0.5 text-xs text-[#547064] dark:text-[#8eb5a4]">
                  {applyModalVacancy.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalVacancy(null)}
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#d6ebe0] bg-[#f4fbf7] text-sm font-bold dark:border-[#1e5e44] dark:bg-[#0b291d]"
              >
                ✕
              </button>
            </div>

            {applyContext.studentCvs.length === 0 ? (
              <div className="space-y-4 rounded-2xl border border-[#d6ebe0] bg-[#f6fbf8] p-5 text-center dark:border-[#1c5c42] dark:bg-[#092319]">
                <p className="text-sm font-bold">{t("applyModal.noCvTitle")}</p>
                <p className="text-xs text-[#547064] dark:text-[#8eb5a4]">
                  {t("applyModal.noCvDesc")}
                </p>
                <Link
                  href="/student/cv"
                  className={`${styles.ctaBtn} h-10 px-5 text-xs`}
                >
                  {t("applyModal.createCvBtn")}
                </Link>
              </div>
            ) : paidCvs.length === 0 ? (
              <ManualCardPaymentBox
                purpose="CV_CREATION"
                amountUzs={5000}
                cvId={applyContext.studentCvs[0]?.id}
                onSubmitted={() => router.refresh()}
              />
            ) : !applyContext.canApply ? (
              <ManualCardPaymentBox
                purpose="WEEKLY_APPLY_PASS"
                amountUzs={5000}
                onSubmitted={() => router.refresh()}
              />
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {applyError ? (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-xs font-bold text-red-600 dark:text-red-300">
                    {applyError}
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-xs font-bold">
                    {t("applyModal.selectCv")}
                  </label>
                  <select
                    value={selectedCvId}
                    onChange={(e) => setSelectedCvId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] px-3 text-sm font-semibold outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white"
                  >
                    {paidCvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold">
                    {t("applyModal.noteLabel")}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    placeholder={t("applyModal.notePlaceholder")}
                    className="w-full rounded-xl border border-[#cde6d9] bg-[#f7fcfa] p-3 text-sm outline-none focus:border-[#0e935f] dark:border-[#1e5e44] dark:bg-[#092319] dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setApplyModalVacancy(null)}
                    className="h-10 cursor-pointer rounded-xl border border-[#d6ebe0] bg-[#f7fcfa] px-4 text-xs font-bold dark:border-[#1e5e44] dark:bg-[#0a261b]"
                  >
                    {t("applyModal.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className={`${styles.ctaBtn} h-10 cursor-pointer px-5 text-xs disabled:opacity-60`}
                  >
                    {submittingApply
                      ? t("applyModal.sending")
                      : t("applyBtn")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
