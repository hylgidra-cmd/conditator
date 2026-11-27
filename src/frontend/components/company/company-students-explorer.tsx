"use client";

import type { WorkType } from "@prisma/client";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CompanySubscriptionPlans } from "@/frontend/components/company/company-subscription-plans";
import { postJson } from "@/backend/client/api";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./company-students-explorer.module.css";

export type CandidateEducationItem = {
  institution: string;
  degree: string | null;
  field: string | null;
  startYear: string | null;
  endYear: string | null;
};

export type CandidateExperienceItem = {
  organization: string;
  position: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type CandidateProjectItem = {
  name: string;
  link?: string | null;
  year?: string | null;
  description?: string | null;
};

export type CandidateExplorerItem = {
  id: string;
  fullName: string;
  shortName: string;
  initials: string;
  photo: string | null;
  roleTitle: string;
  about: string;
  location: string | null;
  regionKey: string;
  workTypes: WorkType[];
  skills: string[];
  languages: Array<{ name: string; level: string | null }>;
  education: CandidateEducationItem[];
  experience: CandidateExperienceItem[];
  projects: CandidateProjectItem[];
  contact: {
    email: string | null;
    phone: string | null;
    telegram: string | null;
    github: string | null;
  };
  personalityLabel: string | null;
  aiScore: number;
  skillMatchCount: number | null;
  isMukammal: boolean;
  isLocked: boolean;
  directionKeys: DirectionKey[];
  savedAtMs: number;
};

export type DirectionKey =
  | "dev"
  | "design"
  | "product"
  | "data"
  | "marketing"
  | "finance";

export type CompanyVacancyOption = {
  id: string;
  title: string;
};

type Props = {
  candidates: CandidateExplorerItem[];
  initialLikedIds: string[];
  hasActiveSubscription: boolean;
  companyVacancies: CompanyVacancyOption[];
  initialQuery?: string;
  initialRegion?: string;
};

const DIRECTION_ORDER: DirectionKey[] = [
  "dev",
  "design",
  "product",
  "data",
  "marketing",
  "finance",
];

const WORK_TYPE_ORDER: WorkType[] = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
];

const DEFAULT_REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Nukus",
  "Farg'ona",
  "Namangan",
  "Xorazm",
  "Qashqadaryo",
  "Navoiy",
];

function prettySkillLabel(skill: string): string {
  const s = skill.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const known: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    react: "React",
    "next.js": "Next.js",
    "node.js": "Node.js",
    html5: "HTML5",
    html: "HTML",
    css3: "CSS3",
    css: "CSS",
    postgresql: "PostgreSQL",
    sql: "SQL",
    python: "Python",
    figma: "Figma",
    "ui/ux": "UI/UX",
    git: "Git",
    smm: "SMM",
    jira: "Jira",
    agile: "Agile",
    "power bi": "Power BI",
    tableau: "Tableau",
    excel: "Excel",
  };
  if (known[lower]) return known[lower];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function matchProjectSkills(
  text: string,
  candidateSkills: string[],
): string[] {
  const hay = text.toLowerCase();
  const matched = candidateSkills.filter((sk) =>
    hay.includes(sk.toLowerCase()),
  );
  if (matched.length > 0) return matched.slice(0, 4);
  return candidateSkills.slice(0, 2);
}

export function CompanyStudentsExplorer({
  candidates,
  initialLikedIds,
  hasActiveSubscription,
  companyVacancies,
  initialQuery = "",
  initialRegion = "",
}: Props) {
  const t = useTranslations("CompanyTalentExplorer");
  const router = useRouter();

  // Search & Filter States
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [listSearchOpen, setListSearchOpen] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);

  const [selectedDirections, setSelectedDirections] = useState<DirectionKey[]>(
    [],
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [skillFilterText, setSkillFilterText] = useState("");
  const skillBoxRef = useRef<HTMLDivElement | null>(null);

  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialRegion ? [initialRegion] : [],
  );
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([]);
  const [minSkillMatch, setMinSkillMatch] = useState<number>(0);

  // Accordion open states
  const [openDirectionSec, setOpenDirectionSec] = useState(true);
  const [openSkillsSec, setOpenSkillsSec] = useState(true);
  const [openRegionSec, setOpenRegionSec] = useState(true);
  const [openWorkTypeSec, setOpenWorkTypeSec] = useState(true);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // Bookmark & Selection states
  const [likedSet, setLikedSet] = useState<Set<string>>(
    () => new Set(initialLikedIds),
  );
  const [busyLikeId, setBusyLikeId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    candidates[0]?.id ?? null,
  );

  // Modals: Direct Message & Unlock Plan
  const [messageTarget, setMessageTarget] =
    useState<CandidateExplorerItem | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>(
    companyVacancies[0]?.id ?? "",
  );
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [unlockModalCvId, setUnlockModalCvId] = useState<string | null>(null);

  // Close skill dropdown on outside click & modals on Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        skillBoxRef.current &&
        !skillBoxRef.current.contains(e.target as Node)
      ) {
        setSkillPickerOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSkillPickerOpen(false);
        setMessageTarget(null);
        setUnlockModalCvId(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Available skills aggregated from real CVs (+ common fallback suggestions)
  const allSkillOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of candidates) {
      for (const sk of c.skills) {
        const clean = sk.trim().toLowerCase();
        if (clean) counts.set(clean, (counts.get(clean) ?? 0) + 1);
      }
    }
    for (const preset of [
      "react",
      "typescript",
      "javascript",
      "python",
      "sql",
      "figma",
      "node.js",
      "git",
      "excel",
    ]) {
      if (!counts.has(preset)) counts.set(preset, 0);
    }
    return Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .map(([key, count]) => ({
        key,
        label: prettySkillLabel(key),
        count,
      }));
  }, [candidates]);

  const filteredSkillOptions = useMemo(() => {
    const q = skillFilterText.trim().toLowerCase();
    return allSkillOptions.filter(
      (opt) =>
        !selectedSkills.includes(opt.key) &&
        (!q || opt.key.includes(q) || opt.label.toLowerCase().includes(q)),
    );
  }, [allSkillOptions, selectedSkills, skillFilterText]);

  // Regions sorted by real candidate presence
  const regionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of DEFAULT_REGIONS) counts.set(r, 0);
    for (const c of candidates) {
      if (c.regionKey) {
        counts.set(c.regionKey, (counts.get(c.regionKey) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return DEFAULT_REGIONS.indexOf(a[0]) - DEFAULT_REGIONS.indexOf(b[0]);
    });
  }, [candidates]);

  const visibleRegions = showAllRegions
    ? regionOptions
    : regionOptions.slice(0, 4);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    const qNorm = appliedQuery.trim().toLowerCase();
    const listNorm = listQuery.trim().toLowerCase();

    return candidates.filter((c) => {
      if (savedOnly && !likedSet.has(c.id)) return false;

      if (qNorm) {
        const hay = [
          c.fullName,
          c.shortName,
          c.roleTitle,
          c.about,
          c.location ?? "",
          ...c.skills,
          ...c.education.map((e) => `${e.institution} ${e.field ?? ""}`),
          ...c.projects.map((p) => `${p.name} ${p.description ?? ""}`),
          ...c.experience.map(
            (ex) => `${ex.organization} ${ex.position ?? ""}`,
          ),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(qNorm)) return false;
      }

      if (listNorm) {
        const subHay =
          `${c.fullName} ${c.shortName} ${c.roleTitle} ${c.skills.join(" ")}`.toLowerCase();
        if (!subHay.includes(listNorm)) return false;
      }

      if (selectedDirections.length > 0) {
        const hasDir = selectedDirections.some((d) =>
          c.directionKeys.includes(d),
        );
        if (!hasDir) return false;
      }

      if (selectedSkills.length > 0) {
        const candSkillsLower = c.skills.map((s) => s.toLowerCase());
        const matchesSkill = selectedSkills.some((sel) =>
          candSkillsLower.some((cs) => cs.includes(sel) || sel.includes(cs)),
        );
        if (!matchesSkill) return false;
      }

      if (selectedRegions.length > 0) {
        const locLower = (c.location ?? "").toLowerCase();
        const matchesReg = selectedRegions.some(
          (reg) =>
            c.regionKey.toLowerCase() === reg.toLowerCase() ||
            locLower.includes(reg.toLowerCase()),
        );
        if (!matchesReg) return false;
      }

      if (selectedWorkTypes.length > 0) {
        const matchesWt = selectedWorkTypes.some((wt) =>
          c.workTypes.includes(wt),
        );
        if (!matchesWt) return false;
      }

      if (minSkillMatch > 0) {
        if ((c.skillMatchCount ?? 0) < minSkillMatch) return false;
      }

      return true;
    });
  }, [
    candidates,
    savedOnly,
    likedSet,
    appliedQuery,
    listQuery,
    selectedDirections,
    selectedSkills,
    selectedRegions,
    selectedWorkTypes,
    minSkillMatch,
  ]);

  const activeCandidate = useMemo(() => {
    if (filteredCandidates.length === 0) return null;
    return (
      filteredCandidates.find((c) => c.id === selectedId) ??
      filteredCandidates[0]
    );
  }, [filteredCandidates, selectedId]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setAppliedQuery(searchInput);
  }

  function clearAllFilters() {
    setSearchInput("");
    setAppliedQuery("");
    setListQuery("");
    setSavedOnly(false);
    setSelectedDirections([]);
    setSelectedSkills([]);
    setSelectedRegions([]);
    setSelectedWorkTypes([]);
    setMinSkillMatch(0);
  }

  function toggleDirection(dir: DirectionKey) {
    setSelectedDirections((prev) =>
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir],
    );
  }

  function toggleRegion(reg: string) {
    setSelectedRegions((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg],
    );
  }

  function toggleWorkType(wt: WorkType) {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt],
    );
  }

  function addSkillFilter(skillKey: string) {
    const clean = skillKey.trim().toLowerCase();
    if (!clean) return;
    if (!selectedSkills.includes(clean)) {
      setSelectedSkills((prev) => [...prev, clean]);
    }
    setSkillFilterText("");
  }

  function removeSkillFilter(skillKey: string) {
    setSelectedSkills((prev) => prev.filter((s) => s !== skillKey));
  }

  async function handleToggleBookmark(cvId: string) {
    if (busyLikeId) return;
    const wasLiked = likedSet.has(cvId);
    setBusyLikeId(cvId);
    setLikedSet((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(cvId);
      else next.add(cvId);
      return next;
    });

    const res = await postJson<{ liked: boolean }>(
      `/api/candidates/${encodeURIComponent(cvId)}/like`,
      {},
    );
    setBusyLikeId(null);

    if (!res.ok) {
      setLikedSet((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(cvId);
        else next.delete(cvId);
        return next;
      });
    }
  }

  function handleOpenMessage(candidate: CandidateExplorerItem) {
    if (!hasActiveSubscription || candidate.isLocked) {
      setUnlockModalCvId(candidate.id);
      return;
    }
    setMessageError(null);
    setMessageText("");
    setMessageTarget(candidate);
  }

  async function submitDirectMessage(openOnly: boolean) {
    if (!messageTarget || sendingMessage) return;
    setSendingMessage(true);
    setMessageError(null);

    const res = await postJson<{ ok: boolean; conversationId: string }>(
      `/api/company/students/${encodeURIComponent(messageTarget.id)}/message`,
      {
        vacancyId: selectedVacancyId || undefined,
        text: openOnly ? undefined : messageText.trim() || undefined,
      },
    );
    setSendingMessage(false);

    if (!res.ok) {
      if (res.error === "SUBSCRIPTION_REQUIRED") {
        const targetId = messageTarget.id;
        setMessageTarget(null);
        setUnlockModalCvId(targetId);
        return;
      }
      setMessageError(t("messageModal.errorDefault"));
      return;
    }

    setMessageTarget(null);
    router.push(`/chat?id=${encodeURIComponent(res.data.conversationId)}`);
  }

  const hasAnyFilter =
    Boolean(appliedQuery.trim()) ||
    Boolean(listQuery.trim()) ||
    savedOnly ||
    selectedDirections.length > 0 ||
    selectedSkills.length > 0 ||
    selectedRegions.length > 0 ||
    selectedWorkTypes.length > 0 ||
    minSkillMatch > 0;

  return (
    <div className={`${styles.stage} font-ui`}>
      <div className="mx-auto max-w-[1400px] px-4 pt-5 pb-16 sm:px-6 lg:px-10 lg:pt-6">
        {/* ================= HERO BANNER (3D CV STACK + MAGNIFYING LOUPE) ================= */}
        <section className={styles.heroWrap}>
          <div aria-hidden className={styles.heroArtwork} />
          <div aria-hidden className={styles.heroScrim} />

          <div className="relative z-10 flex min-h-[178px] flex-col justify-center px-6 py-7 sm:min-h-[206px] sm:px-10 lg:min-h-[224px] lg:px-12">
            <div className="max-w-xl">
              <h1 className="text-[28px] leading-[1.14] font-extrabold tracking-tight text-[#0b2017] sm:text-[36px] lg:text-[40px] dark:text-[#f4fbf8]">
                {t("heroTitle")}
              </h1>
              <p className="mt-2 text-sm font-medium text-[#47675a] sm:text-base dark:text-[#9ec5b4]">
                {t("heroSubtitle")}
              </p>

              {!hasActiveSubscription ? (
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockModalCvId(activeCandidate?.id ?? "plan")
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#0e935f]/28 bg-white/85 px-3.5 py-1.5 text-xs font-extrabold text-[#097349] shadow-sm transition hover:bg-white dark:border-[#34eab0]/38 dark:bg-[#09291d]/90 dark:text-[#3be7a3]"
                  >
                    <svg
                      aria-hidden
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                    <span>{t("unlockSubscriptionBtn")}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ================= FULL-WIDTH SEARCH BAR ================= */}
        <section className={`${styles.searchDock} mt-4 p-2.5 sm:p-3`}>
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]"
          >
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
                className="h-11 w-full rounded-xl border border-[#d4e9de] bg-[#f8fcfa] pr-4 pl-10 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1c5940] dark:bg-[#082117] dark:text-white dark:placeholder:text-[#7da694] dark:focus:border-[#34eab0]"
              />
            </div>

            <button
              type="submit"
              className={`${styles.ctaBtn} h-11 cursor-pointer px-8 text-sm`}
            >
              {t("searchBtn")}
            </button>
          </form>
        </section>

        {/* ================= 3-COLUMN MASTER-DETAIL WORKSPACE ================= */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,360px)_minmax(0,1fr)] lg:items-start">
          {/* ---------- COLUMN 1: LEFT FILTERS ---------- */}
          <aside className={`${styles.panel} p-4 sm:p-5`}>
            <div className="flex items-center justify-between border-b border-[#e4f1eb] pb-3.5 dark:border-[#154531]">
              <div className="flex items-center gap-2">
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
                  className="text-[#0c8a58] dark:text-[#34eab0]"
                >
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="7" x2="17" y1="12" y2="12" />
                  <line x1="10" x2="14" y1="18" y2="18" />
                </svg>
                <h2 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                  {t("filtersTitle")}
                </h2>
              </div>

              <button
                type="button"
                onClick={clearAllFilters}
                disabled={!hasAnyFilter}
                className="cursor-pointer text-xs font-bold text-[#0c8a58] transition hover:underline disabled:cursor-default disabled:opacity-45 dark:text-[#34eab0]"
              >
                {t("clearBtn")}
              </button>
            </div>

            {/* 1. Yo'nalish (Direction) */}
            <div className="border-b border-[#e4f1eb] py-4 dark:border-[#154531]">
              <button
                type="button"
                onClick={() => setOpenDirectionSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-[13px] font-extrabold text-[#122b21] dark:text-[#e6f7ee]">
                  {t("directionTitle")}
                </span>
                <span className="text-xs text-[#648275] dark:text-[#86b29f]">
                  {openDirectionSec ? "▴" : "▾"}
                </span>
              </button>

              {openDirectionSec ? (
                <div className="mt-3 space-y-2.5">
                  {DIRECTION_ORDER.map((dir) => {
                    const checked = selectedDirections.includes(dir);
                    return (
                      <label
                        key={dir}
                        className="flex cursor-pointer items-center gap-2.5 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDirection(dir)}
                          className="size-4 cursor-pointer rounded border-[#b8d8c9] accent-[#0c8a58] dark:border-[#256b4e] dark:accent-[#27eba0]"
                        />
                        <span className="font-medium text-[#223d32] dark:text-[#d4ede1]">
                          {t(`directions.${dir}`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* 2. Ko'nikmalar (Multi-Skill Tag Picker) */}
            <div
              ref={skillBoxRef}
              className="relative border-b border-[#e4f1eb] py-4 dark:border-[#154531]"
            >
              <button
                type="button"
                onClick={() => setOpenSkillsSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-[13px] font-extrabold text-[#122b21] dark:text-[#e6f7ee]">
                  {t("skillsTitle")}
                </span>
                <span className="text-xs text-[#648275] dark:text-[#86b29f]">
                  {openSkillsSec ? "▴" : "▾"}
                </span>
              </button>

              {openSkillsSec ? (
                <div className="mt-3">
                  <div
                    onClick={() => setSkillPickerOpen(true)}
                    className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-2.5 py-1.5 pr-7 relative dark:border-[#1d5e43] dark:bg-[#072016]"
                  >
                    {selectedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#0e935f]/20 bg-[#dff6ea] px-2 py-0.5 text-[11px] font-bold text-[#09754b] dark:border-[#34eab0]/30 dark:bg-[#104631] dark:text-[#4ef0b2]"
                      >
                        <span>{prettySkillLabel(sk)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSkillFilter(sk);
                          }}
                          className="cursor-pointer text-xs leading-none opacity-75 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      value={skillFilterText}
                      onFocus={() => setSkillPickerOpen(true)}
                      onChange={(e) => {
                        setSkillFilterText(e.target.value);
                        setSkillPickerOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillFilterText.trim()) {
                          e.preventDefault();
                          addSkillFilter(skillFilterText);
                        }
                      }}
                      placeholder={
                        selectedSkills.length === 0
                          ? t("skillsPlaceholder")
                          : ""
                      }
                      className="min-w-[68px] flex-1 bg-transparent text-xs font-medium outline-none dark:text-white dark:placeholder:text-[#78a391]"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSkillPickerOpen((v) => !v);
                      }}
                      aria-label={t("skillsTitle")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-xs text-[#5f7f72] dark:text-[#86b29f]"
                    >
                      ▾
                    </button>
                  </div>

                  {skillPickerOpen ? (
                    <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-[#cde6da] bg-white p-1.5 shadow-lg dark:border-[#1f6649] dark:bg-[#082419]">
                      {filteredSkillOptions.length === 0 ? (
                        <p className="px-2.5 py-2 text-xs text-[#648275] dark:text-[#86b29f]">
                          {t("skillsEmpty")}
                        </p>
                      ) : (
                        filteredSkillOptions.slice(0, 12).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              addSkillFilter(opt.key);
                              setSkillPickerOpen(false);
                            }}
                            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-[#183328] transition hover:bg-[#eaf8f1] dark:text-[#dcf5e9] dark:hover:bg-[#0f3827]"
                          >
                            <span>{opt.label}</span>
                            {opt.count > 0 ? (
                              <span className="text-[11px] text-[#6d8a7e] dark:text-[#7da895]">
                                {opt.count}
                              </span>
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* 3. Hudud (Region) */}
            <div className="border-b border-[#e4f1eb] py-4 dark:border-[#154531]">
              <button
                type="button"
                onClick={() => setOpenRegionSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-[13px] font-extrabold text-[#122b21] dark:text-[#e6f7ee]">
                  {t("regionTitle")}
                </span>
                <span className="text-xs text-[#648275] dark:text-[#86b29f]">
                  {openRegionSec ? "▴" : "▾"}
                </span>
              </button>

              {openRegionSec ? (
                <div className="mt-3 space-y-2.5">
                  {visibleRegions.map(([reg, count]) => {
                    const checked = selectedRegions.includes(reg);
                    return (
                      <label
                        key={reg}
                        className="flex cursor-pointer items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRegion(reg)}
                            className="size-4 cursor-pointer rounded border-[#b8d8c9] accent-[#0c8a58] dark:border-[#256b4e] dark:accent-[#27eba0]"
                          />
                          <span className="font-medium text-[#223d32] dark:text-[#d4ede1]">
                            {reg}
                          </span>
                        </span>
                        {count > 0 ? (
                          <span className="text-xs font-semibold text-[#6e8b7f] dark:text-[#7fa896]">
                            ({count})
                          </span>
                        ) : null}
                      </label>
                    );
                  })}

                  {regionOptions.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllRegions((v) => !v)}
                      className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#0c8a58] hover:underline dark:text-[#34eab0]"
                    >
                      <span>
                        {showAllRegions ? t("showLess") : t("showMore")}
                      </span>
                      <span>{showAllRegions ? "▴" : "▾"}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* 4. Ish turi (Work Type) */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setOpenWorkTypeSec((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <span className="text-[13px] font-extrabold text-[#122b21] dark:text-[#e6f7ee]">
                  {t("workTypeTitle")}
                </span>
                <span className="text-xs text-[#648275] dark:text-[#86b29f]">
                  {openWorkTypeSec ? "▴" : "▾"}
                </span>
              </button>

              {openWorkTypeSec ? (
                <div className="mt-3 space-y-2.5">
                  {WORK_TYPE_ORDER.map((wt) => {
                    const checked = selectedWorkTypes.includes(wt);
                    return (
                      <label
                        key={wt}
                        className="flex cursor-pointer items-center gap-2.5 text-[13px]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorkType(wt)}
                          className="size-4 cursor-pointer rounded border-[#b8d8c9] accent-[#0c8a58] dark:border-[#256b4e] dark:accent-[#27eba0]"
                        />
                        <span className="font-medium text-[#223d32] dark:text-[#d4ede1]">
                          {t(`workTypes.${wt}`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* 5. TZ 3: Kamida N ta kasb ko'nikmasi mos (0..6) */}
            <div className="mt-4 border-t border-[#e4f1eb] pt-4 dark:border-[#154531]">
              <label
                htmlFor="min-skill-match"
                className="block text-[13px] font-extrabold text-[#122b21] dark:text-[#e6f7ee]"
              >
                {"Kamida N ta ko'nikma mos"}
              </label>
              <select
                id="min-skill-match"
                value={minSkillMatch}
                onChange={(e) => setMinSkillMatch(Number(e.target.value))}
                className="mt-2 h-9 w-full cursor-pointer rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-2.5 text-xs font-bold outline-none focus:border-[#0e935f] dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white"
              >
                <option value={0}>{"Barchasi (0–6)"}</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {`Kamida ${n} / 6`}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          {/* ---------- COLUMN 2: CANDIDATES LIST ---------- */}
          <section className={`${styles.panel} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-2 pb-3.5">
              <h2 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                {t("selectedStudentsTitle", {
                  count: filteredCandidates.length,
                })}
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSavedOnly((v) => !v)}
                  aria-label={t("savedOnlyAria")}
                  title={t("savedOnlyAria")}
                  className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition ${
                    savedOnly
                      ? "border-[#0e935f] bg-[#e2f7ec] text-[#09754b] dark:border-[#34eab0] dark:bg-[#104530] dark:text-[#34eab0]"
                      : "border-transparent text-[#5b7a6d] hover:bg-[#edf7f2] dark:text-[#8bb5a3] dark:hover:bg-[#0c2d20]"
                  }`}
                >
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill={savedOnly ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setListSearchOpen((v) => !v)}
                  aria-label={t("searchBtn")}
                  className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition ${
                    listSearchOpen || listQuery
                      ? "border-[#0e935f]/35 bg-[#e6f7ef] text-[#09754b] dark:border-[#34eab0]/40 dark:bg-[#0e3a28] dark:text-[#34eab0]"
                      : "border-transparent text-[#5b7a6d] hover:bg-[#edf7f2] dark:text-[#8bb5a3] dark:hover:bg-[#0c2d20]"
                  }`}
                >
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </div>

            {listSearchOpen ? (
              <div className="mb-3">
                <input
                  type="text"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder={t("listSearchPlaceholder")}
                  className="h-9 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3 text-xs font-medium outline-none focus:border-[#0e935f] dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0]"
                />
              </div>
            ) : null}

            {filteredCandidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#cde5d9] px-4 py-10 text-center dark:border-[#1c5940]">
                <p className="text-sm font-bold text-[#153126] dark:text-[#e6f7ee]">
                  {t("emptyListTitle")}
                </p>
                <p className="mt-1 text-xs text-[#607f72] dark:text-[#88b2a0]">
                  {t("emptyListHint")}
                </p>
              </div>
            ) : (
              <div className="max-h-[680px] space-y-2.5 overflow-y-auto pr-0.5">
                {filteredCandidates.map((cand) => {
                  const isActive = activeCandidate?.id === cand.id;
                  const topSkills = cand.skills.slice(0, 2);

                  return (
                    <div
                      key={cand.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(cand.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(cand.id);
                        }
                      }}
                      className={`${styles.candidateCard} ${
                        isActive ? styles.candidateCardActive : ""
                      } flex cursor-pointer items-center justify-between gap-3 p-3.5 outline-none`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {cand.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cand.photo}
                            alt={cand.shortName}
                            className="size-11 shrink-0 rounded-xl object-cover ring-1 ring-[#0e935f]/20 dark:ring-[#34eab0]/30"
                          />
                        ) : (
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d3f3e3] text-sm font-extrabold tracking-tight text-[#086d46] dark:bg-[#104530] dark:text-[#3be7a3]">
                            {cand.initials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-extrabold text-[#0c2219] dark:text-[#f2fbf6]">
                            {cand.shortName}
                          </h3>
                          <p className="truncate text-xs font-medium text-[#4a6a5d] dark:text-[#98c1b0]">
                            {cand.roleTitle}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#5c7b6e] dark:text-[#86b09e]">
                            <svg
                              aria-hidden
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                            >
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate">
                              {cand.location || t("hiddenLocation")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {topSkills.length > 0 ? (
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {cand.skillMatchCount !== null ? (
                            <span className="rounded-full bg-[#e3f7ec] px-2 py-0.5 text-[10px] font-extrabold text-[#086d46] dark:bg-[#104530] dark:text-[#3be7a3]">
                              {`Ko'nikmalar: ${cand.skillMatchCount} / 6`}
                            </span>
                          ) : null}
                          {topSkills.map((sk) => (
                            <span key={sk} className={styles.skillChip}>
                              {prettySkillLabel(sk)}
                            </span>
                          ))}
                        </div>
                      ) : cand.skillMatchCount !== null ? (
                        <span className="shrink-0 rounded-full bg-[#e3f7ec] px-2 py-0.5 text-[10px] font-extrabold text-[#086d46] dark:bg-[#104530] dark:text-[#3be7a3]">
                          {`Ko'nikmalar: ${cand.skillMatchCount} / 6`}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- COLUMN 3: CV PREVIEW (FOLDED DOG-EAR DOCUMENT) ---------- */}
          <section className={`${styles.panel} p-4 sm:p-5 lg:sticky lg:top-22`}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <h2 className="text-[16px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                {t("cvPreviewTitle")}
              </h2>

              {activeCandidate ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(activeCandidate.id)}
                    disabled={busyLikeId === activeCandidate.id}
                    aria-label={t("bookmarkAria")}
                    title={t("bookmarkAria")}
                    className={`inline-flex size-9.5 cursor-pointer items-center justify-center rounded-xl border transition ${
                      likedSet.has(activeCandidate.id)
                        ? "border-[#0e935f] bg-[#e2f7ec] text-[#09754b] dark:border-[#34eab0] dark:bg-[#114832] dark:text-[#34eab0]"
                        : "border-[#cde5d9] bg-white text-[#355649] hover:border-[#0e935f] dark:border-[#1f6246] dark:bg-[#082319] dark:text-[#b6dfd0] dark:hover:border-[#34eab0]"
                    }`}
                  >
                    <svg
                      aria-hidden
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={
                        likedSet.has(activeCandidate.id)
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMessage(activeCandidate)}
                    className={`${styles.ctaBtn} h-9.5 cursor-pointer px-4 text-xs sm:text-[13px]`}
                  >
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    </svg>
                    <span>{t("messageBtn")}</span>
                  </button>
                </div>
              ) : null}
            </div>

            {!activeCandidate ? (
              <div className="rounded-2xl border border-dashed border-[#cde5d9] px-5 py-14 text-center dark:border-[#1c5940]">
                <p className="text-sm font-bold text-[#153126] dark:text-[#e6f7ee]">
                  {t("emptyListTitle")}
                </p>
                <p className="mt-1 text-xs text-[#607f72] dark:text-[#88b2a0]">
                  {t("emptyListHint")}
                </p>
              </div>
            ) : (
              <div className={styles.cvSheetOuter}>
                {/* Authentic Folded Paper Dog-Ear Flap SVG */}
                <svg
                  aria-hidden
                  viewBox="0 0 38 38"
                  className={styles.cvDogEar}
                >
                  <defs>
                    <linearGradient
                      id="dogEarLight"
                      x1="0%"
                      y1="100%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#d3ede1" />
                      <stop offset="100%" stopColor="#eef9f4" />
                    </linearGradient>
                    <linearGradient
                      id="dogEarDark"
                      x1="0%"
                      y1="100%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#196447" />
                      <stop offset="100%" stopColor="#0d3727" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M1 1 L1 26 Q1 36 11 36 L37 36 Z"
                    className="fill-[url(#dogEarLight)] stroke-[#b7dccb] dark:fill-[url(#dogEarDark)] dark:stroke-[#34eab0]/55"
                    strokeWidth="1.2"
                  />
                </svg>

                <article className={`${styles.cvSheet} p-5 sm:p-6`}>
                  {/* Candidate Header */}
                  <div className="flex flex-wrap items-start gap-4 border-b border-[#e5f1eb] pb-5 pr-6 dark:border-[#174d37]">
                    {activeCandidate.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeCandidate.photo}
                        alt={activeCandidate.fullName}
                        className="size-15 shrink-0 rounded-2xl object-cover ring-1 ring-[#0e935f]/25 dark:ring-[#34eab0]/35"
                      />
                    ) : (
                      <div className="flex size-15 shrink-0 items-center justify-center rounded-2xl bg-[#d6f4e5] text-lg font-extrabold tracking-tight text-[#086d46] dark:bg-[#114832] dark:text-[#3be7a3]">
                        {activeCandidate.initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-extrabold tracking-tight text-[#0b2017] dark:text-[#f4fbf8]">
                          {activeCandidate.fullName}
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-[#0e935f]/20 bg-[#ebf9f2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#0a7a4e] dark:border-[#34eab0]/30 dark:bg-[#0d3927] dark:text-[#3be7a3]">
                          {t("aiQualityBadge", {
                            score: activeCandidate.aiScore,
                          })}
                        </span>
                      </div>

                      <p className="mt-0.5 text-sm font-semibold text-[#48685b] dark:text-[#9ec5b4]">
                        {activeCandidate.roleTitle}
                      </p>

                      {activeCandidate.skills.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {activeCandidate.skills.slice(0, 7).map((sk) => (
                            <span key={sk} className={styles.skillChip}>
                              {prettySkillLabel(sk)}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* Contact details or Locked Subscription Notice */}
                      {activeCandidate.isLocked ? (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cde6da] bg-[#f4fbf7] px-3 py-2 text-xs dark:border-[#1c5c42] dark:bg-[#082419]">
                          <span className="text-[#3e5f52] dark:text-[#9bc3b2]">
                            {t("lockedTeaserNotice")}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setUnlockModalCvId(activeCandidate.id)
                            }
                            className="cursor-pointer font-extrabold text-[#0b8555] hover:underline dark:text-[#34eab0]"
                          >
                            {t("unlockSubscriptionBtn")} →
                          </button>
                        </div>
                      ) : activeCandidate.contact.phone ||
                        activeCandidate.contact.email ||
                        activeCandidate.contact.telegram ? (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[#47685b] dark:text-[#98c1b0]">
                          {activeCandidate.contact.phone ? (
                            <span>{activeCandidate.contact.phone}</span>
                          ) : null}
                          {activeCandidate.contact.email ? (
                            <span>{activeCandidate.contact.email}</span>
                          ) : null}
                          {activeCandidate.contact.telegram ? (
                            <span>{activeCandidate.contact.telegram}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* EDUCATION SECTION */}
                  <div className="border-b border-[#e5f1eb] py-4 dark:border-[#174d37]">
                    <div className="flex items-center gap-2">
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
                        className="text-[#0c8a58] dark:text-[#34eab0]"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                      </svg>
                      <h4 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                        {t("educationTitle")}
                      </h4>
                    </div>

                    {activeCandidate.education.length === 0 ? (
                      <p className="mt-2.5 text-xs text-[#648275] dark:text-[#86b29f]">
                        {t("educationEmpty")}
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {activeCandidate.education.map((edu, idx) => {
                          const degreeLine = [edu.field, edu.degree]
                            .filter(Boolean)
                            .join(" — ");
                          const yearsLine =
                            edu.startYear || edu.endYear
                              ? `${edu.startYear ?? ""} – ${edu.endYear ?? t("presentLabel")}`
                              : null;

                          return (
                            <li
                              key={`${edu.institution}-${idx}`}
                              className="flex items-start gap-2.5"
                            >
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#0e935f] dark:bg-[#34eab0]" />
                              <div className="min-w-0">
                                <p className="text-[13.5px] font-bold text-[#10291f] dark:text-[#eefaf3]">
                                  {edu.institution}
                                </p>
                                {degreeLine ? (
                                  <p className="text-xs font-medium text-[#4f6e61] dark:text-[#9ec5b4]">
                                    {degreeLine}
                                  </p>
                                ) : null}
                                {yearsLine ? (
                                  <p className="mt-0.5 text-xs text-[#6a887b] dark:text-[#82ad9a]">
                                    {yearsLine}
                                  </p>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* PROJECTS SECTION (shown when candidate has projects) */}
                  {activeCandidate.projects.length > 0 ? (
                    <div className="border-b border-[#e5f1eb] py-4 dark:border-[#174d37]">
                      <div className="flex items-center gap-2">
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
                          className="text-[#0c8a58] dark:text-[#34eab0]"
                        >
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                        <h4 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                          {t("projectsTitle")}
                        </h4>
                      </div>

                      <ul className="mt-3 space-y-3.5">
                        {activeCandidate.projects.map((proj, idx) => {
                          const pSkills = matchProjectSkills(
                            `${proj.name} ${proj.description ?? ""}`,
                            activeCandidate.skills,
                          );
                          return (
                            <li
                              key={`${proj.name}-${idx}`}
                              className="flex items-start gap-2.5"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#10291f] dark:bg-[#9ec5b4]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold text-[#10291f] dark:text-[#eefaf3]">
                                  {proj.name}
                                  {proj.year ? ` (${proj.year})` : ""}
                                </p>
                                {proj.description ? (
                                  <p className="mt-0.5 text-xs leading-relaxed text-[#4f6e61] dark:text-[#9ec5b4]">
                                    {proj.description}
                                  </p>
                                ) : null}
                                {pSkills.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {pSkills.map((sk) => (
                                      <span
                                        key={sk}
                                        className={styles.skillChip}
                                      >
                                        {prettySkillLabel(sk)}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {/* EXPERIENCE SECTION (shown when candidate has work experience) */}
                  {activeCandidate.experience.length > 0 ? (
                    <div className="border-b border-[#e5f1eb] py-4 dark:border-[#174d37]">
                      <div className="flex items-center gap-2">
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
                          className="text-[#0c8a58] dark:text-[#34eab0]"
                        >
                          <rect
                            width="20"
                            height="14"
                            x="2"
                            y="7"
                            rx="2"
                            ry="2"
                          />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        <h4 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                          {t("experienceTitle")}
                        </h4>
                      </div>

                      <ul className="mt-3 space-y-3.5">
                        {activeCandidate.experience.map((exp, idx) => {
                          const eSkills = matchProjectSkills(
                            `${exp.organization} ${exp.position ?? ""} ${exp.description ?? ""}`,
                            activeCandidate.skills,
                          );
                          const period =
                            exp.startDate || exp.endDate
                              ? `${exp.startDate ?? ""} – ${exp.endDate ?? t("presentLabel")}`
                              : null;

                          return (
                            <li
                              key={`${exp.organization}-${idx}`}
                              className="flex items-start gap-2.5"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#10291f] dark:bg-[#9ec5b4]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold text-[#10291f] dark:text-[#eefaf3]">
                                  {exp.position
                                    ? `${exp.position} · ${exp.organization}`
                                    : exp.organization}
                                </p>
                                {period ? (
                                  <p className="text-[11px] font-medium text-[#6a887b] dark:text-[#82ad9a]">
                                    {period}
                                  </p>
                                ) : null}
                                {exp.description ? (
                                  <p className="mt-0.5 text-xs leading-relaxed text-[#4f6e61] dark:text-[#9ec5b4]">
                                    {exp.description}
                                  </p>
                                ) : null}
                                {eSkills.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {eSkills.map((sk) => (
                                      <span
                                        key={sk}
                                        className={styles.skillChip}
                                      >
                                        {prettySkillLabel(sk)}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {/* GOAL / ABOUT FALLBACK WHEN NEITHER PROJECTS NOR EXPERIENCE */}
                  {activeCandidate.projects.length === 0 &&
                  activeCandidate.experience.length === 0 &&
                  activeCandidate.about ? (
                    <div className="border-b border-[#e5f1eb] py-4 dark:border-[#174d37]">
                      <h4 className="text-[14px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                        {t("aboutTitle")}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#4f6e61] dark:text-[#9ec5b4]">
                        {activeCandidate.about}
                      </p>
                    </div>
                  ) : null}

                  {/* LANGUAGES, PERSONALITY & FOOTER ACTIONS */}
                  <div className="pt-4">
                    {(activeCandidate.languages.length > 0 ||
                      activeCandidate.personalityLabel) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {activeCandidate.languages.map((lang) => (
                          <span
                            key={lang.name}
                            className="inline-flex items-center rounded-lg border border-[#d6eae0] bg-[#f5fbf8] px-2.5 py-1 text-[11px] font-semibold text-[#2a4a3d] dark:border-[#1b593f] dark:bg-[#09261b] dark:text-[#c7ebd9]"
                          >
                            {lang.level
                              ? `${prettySkillLabel(lang.name)} (${lang.level})`
                              : prettySkillLabel(lang.name)}
                          </span>
                        ))}

                        {activeCandidate.personalityLabel ? (
                          <span className="inline-flex items-center rounded-lg border border-[#0e935f]/25 bg-[#ebf9f2] px-2.5 py-1 text-[11px] font-bold text-[#09754b] dark:border-[#34eab0]/30 dark:bg-[#0e3a28] dark:text-[#4ef0b2]">
                            {activeCandidate.personalityLabel}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <Link
                        href={`/company/students/${activeCandidate.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0b8555] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("openFullCv")}</span>
                        <span>→</span>
                      </Link>

                      {activeCandidate.isLocked ? (
                        <button
                          type="button"
                          onClick={() =>
                            setUnlockModalCvId(activeCandidate.id)
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#cde6da] bg-[#f4fbf7] px-3 py-1.5 text-xs font-bold text-[#09754b] transition hover:border-[#0e935f] dark:border-[#1e6146] dark:bg-[#0a291d] dark:text-[#3be7a3]"
                        >
                          {t("unlockSubscriptionBtn")}
                        </button>
                      ) : (
                        <a
                          href={`/api/cv/${activeCandidate.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#cde6da] bg-[#f4fbf7] px-3 py-1.5 text-xs font-bold text-[#09754b] transition hover:border-[#0e935f] dark:border-[#1e6146] dark:bg-[#0a291d] dark:text-[#3be7a3]"
                        >
                          <svg
                            aria-hidden
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                          <span>{t("downloadPdf")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ================= DIRECT MESSAGE MODAL ================= */}
      {messageTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setMessageTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#cde6da] bg-white p-6 shadow-2xl dark:border-[#247353] dark:bg-[#071f16]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2219] dark:text-[#f2fbf6]">
                  {t("messageModal.title")}
                </h3>
                <p className="mt-1 text-xs text-[#557568] dark:text-[#98c1b0]">
                  {t("messageModal.subtitle", {
                    name: messageTarget.fullName,
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMessageTarget(null)}
                className="cursor-pointer rounded-lg px-2 py-1 text-sm font-bold text-[#5b7a6d] hover:bg-[#edf7f2] dark:text-[#98c1b0] dark:hover:bg-[#0d3123]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {companyVacancies.length > 0 ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#183328] dark:text-[#d9f3e7]">
                    {t("messageModal.vacancyLabel")}
                  </label>
                  <select
                    value={selectedVacancyId}
                    onChange={(e) => setSelectedVacancyId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3 text-xs font-semibold outline-none focus:border-[#0e935f] dark:border-[#1f6246] dark:bg-[#09261b] dark:text-white"
                  >
                    <option value="">{t("messageModal.vacancyNone")}</option>
                    {companyVacancies.map((vac) => (
                      <option key={vac.id} value={vac.id}>
                        {vac.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#183328] dark:text-[#d9f3e7]">
                  {t("messageModal.messageLabel")}
                </label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t("messageModal.messagePlaceholder")}
                  className="w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] p-3 text-xs leading-relaxed outline-none focus:border-[#0e935f] dark:border-[#1f6246] dark:bg-[#09261b] dark:text-white dark:placeholder:text-[#78a391]"
                />
              </div>

              {messageError ? (
                <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
                  {messageError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMessageTarget(null)}
                  className="h-9.5 cursor-pointer rounded-xl border border-[#cde6da] px-3.5 text-xs font-bold text-[#355649] hover:bg-[#f2faf6] dark:border-[#1f6246] dark:text-[#bfe5d4] dark:hover:bg-[#0c2e20]"
                >
                  {t("messageModal.cancel")}
                </button>
                <button
                  type="button"
                  disabled={sendingMessage}
                  onClick={() => submitDirectMessage(true)}
                  className="h-9.5 cursor-pointer rounded-xl border border-[#0e935f]/35 bg-[#e6f7ef] px-3.5 text-xs font-extrabold text-[#09754b] hover:bg-[#d8f3e6] dark:border-[#34eab0]/40 dark:bg-[#0e3b29] dark:text-[#3be7a3]"
                >
                  {t("messageModal.openChatOnly")}
                </button>
                <button
                  type="button"
                  disabled={sendingMessage || !messageText.trim()}
                  onClick={() => submitDirectMessage(false)}
                  className={`${styles.ctaBtn} h-9.5 cursor-pointer px-4 text-xs disabled:opacity-55`}
                >
                  {sendingMessage
                    ? t("messageModal.sending")
                    : t("messageModal.sendAndOpen")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ================= SUBSCRIPTION UNLOCK MODAL ================= */}
      {unlockModalCvId ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setUnlockModalCvId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#cde6da] bg-white p-6 shadow-2xl dark:border-[#247353] dark:bg-[#071f16]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0c2219] dark:text-[#f2fbf6]">
                  {t("unlockModal.title")}
                </h3>
                <p className="mt-1 text-xs text-[#557568] dark:text-[#98c1b0]">
                  {t("unlockModal.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalCvId(null)}
                className="cursor-pointer rounded-lg px-2 py-1 text-sm font-bold text-[#5b7a6d] hover:bg-[#edf7f2] dark:text-[#98c1b0] dark:hover:bg-[#0d3123]"
              >
                ✕
              </button>
            </div>

            <CompanySubscriptionPlans
              cvId={unlockModalCvId === "plan" ? undefined : unlockModalCvId}
              compact
              onSubmitted={() => setUnlockModalCvId(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
