"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { postJson, requestJson } from "@/backend/client/api";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./student-account.module.css";
import {
  AccountSecurityModal,
  type ActiveModalType,
  ActiveSessionsModal,
  ChangePasswordModal,
  EditProfileModal,
  PrivacySettingsModal,
  type PrivacyState,
  type StudentProfileState,
  WeeklyPassModal,
} from "./student-account-modals";

export type StudentApplicationRow = {
  id: string;
  vacancyId: string;
  companyId: string;
  companyName: string;
  companyHasLogo: boolean;
  position: string;
  status: "SUBMITTED" | "VIEWED" | "INTERESTED" | "ACCEPTED" | "REJECTED";
  dateLabel: string;
};

export type StudentSavedVacancyRow = {
  vacancyId: string;
  title: string;
  companyId: string;
  companyName: string;
  companyHasLogo: boolean;
};

export type StudentRecentMessageRow = {
  id: string;
  href: string;
  senderName: string;
  initials: string;
  subject: string;
  snippet: string;
  timeLabel: string;
  unread: boolean;
};

export type StudentAccountDashboardProps = {
  initialProfile: StudentProfileState;
  initialPrivacy: PrivacyState;
  emailVerified: boolean;
  accountCreatedLabel: string;
  hasSkills: boolean;
  cvInfo: {
    id: string | null;
    fileName: string;
    updatedLabel: string | null;
    hasSavedCv: boolean;
  };
  stats: {
    applicationsTotal: number;
    unreadMessages: number;
    submitted: number;
    inReview: number;
    responded: number;
  };
  applyPass: {
    active: boolean;
    daysLeft: number;
    pendingPayment: boolean;
  };
  recentApplications: StudentApplicationRow[];
  initialSavedVacancies: StudentSavedVacancyRow[];
  recentMessages: StudentRecentMessageRow[];
};

const LOCALE_LABELS: Record<string, { code: string; name: string }> = {
  kk: { code: "KK", name: "Qaraqalpaqsha" },
  uz: { code: "UZ", name: "Oʻzbek tili" },
  ru: { code: "RU", name: "Русский язык" },
  en: { code: "EN", name: "English" },
};

const MONOGRAM_TONES = [
  "bg-[#e3f7ee] text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]",
  "bg-[#e6f0fe] text-[#1d5fd6] dark:bg-[#102949] dark:text-[#66a8ff]",
  "bg-[#efe8fe] text-[#6d37d6] dark:bg-[#231744] dark:text-[#b28cff]",
  "bg-[#fef1de] text-[#b8670e] dark:bg-[#38250e] dark:text-[#f7b859]",
] as const;

function pickTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return MONOGRAM_TONES[Math.abs(hash) % MONOGRAM_TONES.length];
}

function CompanyBadge({
  companyId,
  name,
  hasLogo,
  size = "md",
}: {
  companyId: string;
  name: string;
  hasLogo: boolean;
  size?: "sm" | "md";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const dim = size === "sm" ? "size-8 rounded-lg text-xs" : "size-10 rounded-xl text-sm";
  const initial = (name.trim() || "C").slice(0, 1).toUpperCase();

  if (hasLogo && !imgFailed) {
    return (
      <span
        className={`inline-flex ${dim} shrink-0 items-center justify-center overflow-hidden border border-[#d8ede2] bg-white dark:border-[#1f5f45] dark:bg-[#0b261b]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/companies/${companyId}/logo`}
          alt=""
          onError={() => setImgFailed(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center font-extrabold ${pickTone(companyId + name)}`}
    >
      {initial}
    </span>
  );
}

export function StudentAccountDashboard({
  initialProfile,
  initialPrivacy,
  emailVerified,
  accountCreatedLabel,
  hasSkills,
  cvInfo,
  stats,
  applyPass,
  recentApplications,
  initialSavedVacancies,
  recentMessages,
}: StudentAccountDashboardProps) {
  const t = useTranslations("StudentAccount");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<StudentProfileState>(initialProfile);
  const [privacyState, setPrivacyState] = useState<PrivacyState>(initialPrivacy);
  const [savedVacancies, setSavedVacancies] = useState<StudentSavedVacancyRow[]>(
    initialSavedVacancies,
  );
  const [removingBookmarkId, setRemovingBookmarkId] = useState<string | null>(null);
  const [pendingPass, setPendingPass] = useState(applyPass.pendingPayment);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [langMenuOpen]);

  // Salom va profil ko'rsatkichlari
  const emailPrefix = profile.email.split("@")[0] ?? profile.email;
  const formattedEmailName =
    emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const displayName = profile.fullName.trim() || formattedEmailName;
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  // Profil to'ldirilganlik foizi (real 4 mezon × 25% = 100%)
  const hasPhoto = Boolean(profile.avatarUrl);
  const hasEducation = Boolean(profile.educationSummary.trim());
  const hasSavedCv = cvInfo.hasSavedCv;
  const completionChecks = [
    {
      key: "photo",
      label: t("completion.photo"),
      done: hasPhoto,
      onClick: () => setActiveModal("editProfile"),
    },
    {
      key: "education",
      label: t("completion.education"),
      done: hasEducation,
      onClick: () => setActiveModal("editProfile"),
    },
    {
      key: "skills",
      label: t("completion.skills"),
      done: hasSkills,
      onClick: () => router.push("/student/cv"),
    },
    {
      key: "cv",
      label: t("completion.cv"),
      done: hasSavedCv,
      onClick: () => router.push("/student/cv"),
    },
  ];
  const completedCount = completionChecks.filter((item) => item.done).length;
  const completionPct = completedCount * 25;
  const ringRadius = 27;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (completionPct / 100) * ringCircumference;

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await postJson("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  async function handleRemoveSavedVacancy(vacancyId: string) {
    if (removingBookmarkId) return;
    setRemovingBookmarkId(vacancyId);
    const prev = savedVacancies;
    setSavedVacancies((list) => list.filter((v) => v.vacancyId !== vacancyId));
    const res = await requestJson("DELETE", `/api/vacancies/${vacancyId}/bookmark`);
    setRemovingBookmarkId(null);
    if (!res.ok) {
      setSavedVacancies(prev);
    }
  }

  async function handleSelectLanguage(nextLocale: "kk" | "uz" | "ru" | "en") {
    setLangMenuOpen(false);
    if (nextLocale === locale) return;
    void requestJson("PATCH", "/api/account/profile", { locale: nextLocale });
    router.replace(pathname, { locale: nextLocale });
  }

  function handleCompleteProfileClick() {
    if (!hasPhoto || !hasEducation) {
      setActiveModal("editProfile");
    } else {
      router.push("/student/cv");
    }
  }

  function statusBadgeForApp(
    status: StudentApplicationRow["status"],
  ): { label: string; className: string } {
    if (status === "VIEWED") {
      return {
        label: t("appStatus.inReview"),
        className:
          "bg-[#fef2d6] text-[#9e640c] border border-[#f5dca3] dark:bg-[#3a2a0d] dark:text-[#f6be4f] dark:border-[#664914]",
      };
    }
    if (status === "SUBMITTED") {
      return {
        label: t("appStatus.submitted"),
        className:
          "bg-[#e3f1fe] text-[#1a62bd] border border-[#bfdcf9] dark:bg-[#102b47] dark:text-[#6eb4ff] dark:border-[#1e4d7b]",
      };
    }
    if (status === "REJECTED") {
      return {
        label: t("appStatus.rejected"),
        className:
          "bg-[#fee6e6] text-[#b82e2e] border border-[#f9c4c4] dark:bg-[#3b1518] dark:text-[#f88080] dark:border-[#692429]",
      };
    }
    return {
      label: t("appStatus.responded"),
      className:
        "bg-[#dff6ea] text-[#0c7e50] border border-[#b4e8cd] dark:bg-[#0f3a28] dark:text-[#4ade9b] dark:border-[#1d6849]",
    };
  }

  const currentLang = LOCALE_LABELS[locale] ?? LOCALE_LABELS.uz;

  return (
    <div className={`${styles.stage} font-ui`}>
      <div aria-hidden className={styles.bgTopLayer} />
      <div aria-hidden className={styles.bgBottomLayer} />
      <div aria-hidden className={styles.ambientGlow} />

      <div className="mx-auto max-w-[1360px] px-4 pt-7 pb-14 sm:px-7 lg:px-11 lg:pt-9 lg:pb-16">
        {/* Hero Greeting */}
        <Reveal immediate>
          <header className="mb-7 max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#557367] uppercase dark:text-[#8eb5a4]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1.5 text-[28px] leading-[1.15] font-extrabold tracking-tight text-[#0b1f17] sm:text-[36px] dark:text-[#f3fbf7]">
              {t("greeting", { name: firstName })}{" "}
              <span aria-hidden className={styles.waveHand}>
                👋
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#4f6d61] sm:text-[15px] dark:text-[#98beae]">
              {t("heroSubtitle")}
            </p>
          </header>
        </Reveal>

        {/* Main 2-Zone Layout: Left Profile Sidebar + Right Operational Area */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[276px_minmax(0,1fr)] xl:grid-cols-[292px_minmax(0,1fr)]">
          {/* ================= LEFT COLUMN ================= */}
          <div className="space-y-5">
            {/* 1. Profile Identity Card */}
            <Reveal immediate>
              <section className={`${styles.card} p-5 text-center sm:p-6`}>
                <div className="mx-auto flex justify-center">
                  <div className={styles.avatarBox}>
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarUrl}
                        alt={displayName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-[34px] leading-none font-extrabold tracking-tight">
                        {avatarInitial}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="mt-4 truncate text-lg font-extrabold tracking-tight">
                  {displayName}
                </h2>
                <p className="mt-0.5 truncate text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                  {profile.email}
                </p>

                <div className="mt-3 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c3e8d7] bg-[#e6f7ef] px-3 py-1 text-[11px] font-bold text-[#0b7e50] dark:border-[#1d6849] dark:bg-[#0d3324] dark:text-[#4ade9b]">
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
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                    </svg>
                    {t("studentAccountBadge")}
                  </span>
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal("editProfile")}
                    className={`${styles.outlineBtn} h-10 w-full cursor-pointer text-xs`}
                  >
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    <span>{t("editProfile")}</span>
                  </button>

                  <button
                    type="button"
                    disabled={signingOut}
                    onClick={handleSignOut}
                    className={`${styles.primaryBtn} h-10 w-full cursor-pointer text-xs disabled:opacity-65`}
                  >
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    <span>{signingOut ? t("signingOut") : t("signOut")}</span>
                  </button>
                </div>
              </section>
            </Reveal>

            {/* 2. Personal Information Card */}
            <Reveal immediate delay={75}>
              <section className={`${styles.card} p-5`}>
                <div className="mb-3.5 flex items-center gap-2.5">
                  <span className={`${styles.iconBadge} size-8`}>
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
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <h2 className="text-[15px] font-extrabold tracking-tight">
                    {t("personalInfo")}
                  </h2>
                </div>

                <dl className="divide-y divide-[#e3f1ea] dark:divide-[#144330]">
                  <div className="flex items-start gap-3 py-3 first:pt-1">
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.role")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold">
                        {t("roleStudent")}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3">
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <line x1="3" x2="21" y1="22" y2="22" />
                      <line x1="6" x2="6" y1="18" y2="11" />
                      <line x1="10" x2="10" y1="18" y2="11" />
                      <line x1="14" x2="14" y1="18" y2="11" />
                      <line x1="18" x2="18" y1="18" y2="11" />
                      <polygon points="12 2 20 7 4 7" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.education")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] leading-snug font-bold break-words">
                        {profile.educationSummary.trim() || (
                          <button
                            type="button"
                            onClick={() => setActiveModal("editProfile")}
                            className="cursor-pointer text-xs font-semibold text-[#0c8a58] underline-offset-2 hover:underline dark:text-[#34eab0]"
                          >
                            + {t("addInfo")}
                          </button>
                        )}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3">
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.city")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold">
                        {profile.city.trim() || (
                          <span className="font-medium text-[#6f8b80] dark:text-[#7ca594]">
                            {t("notSpecified")}
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3">
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.phone")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold">
                        {profile.phone.trim() || (
                          <span className="font-medium text-[#6f8b80] dark:text-[#7ca594]">
                            {t("notSpecified")}
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 last:pb-1">
                    <svg
                      aria-hidden
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.created")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold">
                        {accountCreatedLabel}
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>
            </Reveal>

            {/* 3. Profile Completion Card */}
            <Reveal immediate delay={150}>
              <section className={`${styles.card} p-5`}>
                <div className="flex items-center gap-3.5">
                  <div className="relative flex size-[66px] shrink-0 items-center justify-center">
                    <svg
                      width="66"
                      height="66"
                      viewBox="0 0 66 66"
                      className="-rotate-90"
                    >
                      <circle
                        cx="33"
                        cy="33"
                        r={ringRadius}
                        fill="none"
                        strokeWidth="6"
                        className="stroke-[#dcf1e6] dark:stroke-[#103828]"
                      />
                      <circle
                        cx="33"
                        cy="33"
                        r={ringRadius}
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringDashOffset}
                        className="stroke-[#0d925e] transition-all duration-700 ease-out dark:stroke-[#26db95]"
                      />
                    </svg>
                    <span className="absolute text-sm font-extrabold">
                      {completionPct}%
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-extrabold tracking-tight">
                      {t("completion.title")}
                    </h2>
                    <p className="mt-1 text-[11.5px] leading-snug text-[#567367] dark:text-[#8eb5a4]">
                      {t("completion.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {completionChecks.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left`}
                    >
                      <span className="flex items-center gap-2.5">
                        {item.done ? (
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#0e9962] text-white dark:bg-[#22d08c] dark:text-[#042417]">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex size-5 rounded-full border-2 border-[#9ebfb0] dark:border-[#327358]" />
                        )}
                        <span className="text-xs font-bold">{item.label}</span>
                      </span>
                      <span className="text-sm font-semibold text-[#6b897d] dark:text-[#7da997]">
                        ›
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCompleteProfileClick}
                  className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#bce3d1] bg-[#edf9f3] text-xs font-extrabold text-[#0b7e50] transition hover:bg-[#dff4ea] dark:border-[#1e6a4a] dark:bg-[#0c2e20] dark:text-[#4ade9b] dark:hover:bg-[#113d2b]"
                >
                  <span>{t("completion.cta")}</span>
                  <span aria-hidden>→</span>
                </button>
              </section>
            </Reveal>
          </div>

          {/* ================= RIGHT MAIN AREA ================= */}
          <div className="space-y-5">
            {/* Top Row: 3 KPI Stat Cards */}
            <Reveal immediate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/student/applications"
                  className={`${styles.kpiCard} flex items-center justify-between p-4 sm:px-5 sm:py-4`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`${styles.iconBadge} size-11 shrink-0`}>
                      <svg
                        aria-hidden
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.applications")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={stats.applicationsTotal} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("saved-vacancies-card");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    else router.push("/vacancies");
                  }}
                  className={`${styles.kpiCard} flex cursor-pointer items-center justify-between p-4 text-left sm:px-5 sm:py-4`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`${styles.iconBadge} size-11 shrink-0`}>
                      <svg
                        aria-hidden
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.savedVacancies")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={savedVacancies.length} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </button>

                <Link
                  href="/chat"
                  className={`${styles.kpiCard} flex items-center justify-between p-4 sm:px-5 sm:py-4`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`${styles.iconBadge} size-11 shrink-0`}>
                      <svg
                        aria-hidden
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.unreadMessages")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={stats.unreadMessages} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </Link>
              </div>
            </Reveal>

            {/* Inner 2-Column Grid: Center Operational Cards + Right Shortcut/Settings Cards */}
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(265px,1fr)]">
              {/* ---------- CENTER SUB-COLUMN ---------- */}
              <div className="space-y-5">
                {/* 1. My CV Card */}
                <Reveal immediate delay={75}>
                  <section className={`${styles.card} p-5 sm:p-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`${styles.iconBadge} size-9`}>
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
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" x2="8" y1="13" y2="13" />
                            <line x1="16" x2="8" y1="17" y2="17" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("cvCard.title")}
                        </h2>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                          cvInfo.hasSavedCv
                            ? "border border-[#bfe8d4] bg-[#e5f7ee] text-[#0b8051] dark:border-[#1e6a4a] dark:bg-[#0e3626] dark:text-[#4ade9b]"
                            : "border border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {cvInfo.hasSavedCv ? `✓ ${t("cvCard.upToDate")}` : t("cvCard.draft")}
                      </span>
                    </div>

                    <div
                      className={`${styles.subSurface} mt-4 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-4`}
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span className="inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border border-[#c6e8d7] bg-[#e6f7ef] text-[10px] font-extrabold text-[#0b8455] dark:border-[#1f6548] dark:bg-[#0f3827] dark:text-[#34eab0]">
                          <svg
                            aria-hidden
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="mt-0.5 leading-none">CV</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">
                            {cvInfo.fileName}
                          </p>
                          <p className="mt-0.5 text-xs text-[#59776b] dark:text-[#8eb5a4]">
                            {cvInfo.updatedLabel
                              ? t("cvCard.lastUpdated", { date: cvInfo.updatedLabel })
                              : t("cvCard.notCreatedHint")}
                          </p>
                        </div>
                      </div>

                      {cvInfo.id ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/student/cv/preview?cvId=${cvInfo.id}`}
                            aria-label={t("cvCard.viewBtn")}
                            className="inline-flex size-9 items-center justify-center rounded-xl border border-[#d4eae0] bg-white text-[#355447] transition hover:border-[#0e935f] hover:text-[#0b8455] dark:border-[#1f5f45] dark:bg-[#082017] dark:text-[#bde3d1] dark:hover:border-[#34eab0]"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>

                          <a
                            href={`/api/cv/me/pdf?cvId=${encodeURIComponent(cvInfo.id)}`}
                            aria-label={t("cvCard.downloadPdf")}
                            className="inline-flex size-9 items-center justify-center rounded-xl border border-[#d4eae0] bg-white text-[#355447] transition hover:border-[#0e935f] hover:text-[#0b8455] dark:border-[#1f5f45] dark:bg-[#082017] dark:text-[#bde3d1] dark:hover:border-[#34eab0]"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" x2="12" y1="15" y2="3" />
                            </svg>
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Link
                        href="/student/cv"
                        className={`${styles.primaryBtn} h-11 text-xs sm:text-[13px]`}
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>
                        <span>{t("cvCard.updateBtn")}</span>
                      </Link>

                      <Link
                        href={
                          cvInfo.id
                            ? `/student/cv/preview?cvId=${cvInfo.id}`
                            : "/student/cv"
                        }
                        className={`${styles.outlineBtn} h-11 text-xs sm:text-[13px]`}
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
                          className="text-[#0c8a58] dark:text-[#34eab0]"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{t("cvCard.viewBtn")}</span>
                      </Link>
                    </div>
                  </section>
                </Reveal>

                {/* 2. My Applications + Weekly Pass + Recent Applications Table */}
                <Reveal immediate delay={75}>
                  <section className={`${styles.card} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`${styles.iconBadge} size-9`}>
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
                          >
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("appsCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/student/applications"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("viewAll")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    {/* 3 Status Sub-Counters */}
                    <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                      <div className={`${styles.subSurface} p-3 sm:px-3.5`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#557266] dark:text-[#92bba9]">
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
                            className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <line x1="22" x2="11" y1="2" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          <span className="truncate">{t("appStatus.submitted")}</span>
                        </div>
                        <p className="mt-1.5 text-xl font-extrabold">
                          <AnimatedNumber value={stats.submitted} />
                        </p>
                      </div>

                      <div className={`${styles.subSurface} p-3 sm:px-3.5`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#557266] dark:text-[#92bba9]">
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
                            className="shrink-0 text-[#d98a12] dark:text-[#f6be4f]"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="truncate">{t("appStatus.inReview")}</span>
                        </div>
                        <p className="mt-1.5 text-xl font-extrabold">
                          <AnimatedNumber value={stats.inReview} />
                        </p>
                      </div>

                      <div className={`${styles.subSurface} p-3 sm:px-3.5`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#557266] dark:text-[#92bba9]">
                          <svg
                            aria-hidden
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-[#0d9661] dark:text-[#34eab0]"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="truncate">{t("appStatus.responded")}</span>
                        </div>
                        <p className="mt-1.5 text-xl font-extrabold">
                          <AnimatedNumber value={stats.responded} />
                        </p>
                      </div>
                    </div>

                    {/* Weekly Application Pass Banner */}
                    <div
                      className={`${styles.passBanner} mt-4 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-4`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#0b8455] shadow-xs dark:bg-[#082419] dark:text-[#34eab0]">
                          <svg
                            aria-hidden
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">
                            {t("pass.title")}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-[#3b6152] dark:text-[#9ec7b6]">
                            {applyPass.active
                              ? t("pass.activeDesc")
                              : pendingPass
                                ? t("pass.pendingDesc")
                                : t("pass.inactiveDesc")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {applyPass.active ? (
                          <span className="rounded-full border border-[#f2d699] bg-[#fef3d6] px-3 py-1 text-[11px] font-bold text-[#9a630e] dark:border-[#684a14] dark:bg-[#38290d] dark:text-[#f6be4f]">
                            {t("pass.expiresIn", { days: applyPass.daysLeft })}
                          </span>
                        ) : pendingPass ? (
                          <span className="rounded-full border border-[#f2d699] bg-[#fef3d6] px-3 py-1 text-[11px] font-bold text-[#9a630e] dark:border-[#684a14] dark:bg-[#38290d] dark:text-[#f6be4f]">
                            {t("pass.pendingBadge")}
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#bfe4d2] bg-white/80 px-3 py-1 text-[11px] font-bold text-[#0c7f51] dark:border-[#1f6849] dark:bg-[#092419] dark:text-[#4ade9b]">
                            5 000 UZS
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveModal("weeklyPass")}
                          className={`${styles.primaryBtn} h-9 cursor-pointer px-3.5 text-xs`}
                        >
                          <svg
                            aria-hidden
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 16h5v5" />
                          </svg>
                          <span>
                            {applyPass.active ? t("pass.renewBtn") : t("pass.activateBtn")}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Applications Sub-Table */}
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-[14px] font-extrabold tracking-tight">
                          {t("appsCard.recentTitle")}
                        </h3>
                        <Link
                          href="/student/applications"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                        >
                          <span>{t("viewAll")}</span>
                          <span aria-hidden>→</span>
                        </Link>
                      </div>

                      {recentApplications.length === 0 ? (
                        <div
                          className={`${styles.subSurface} px-4 py-6 text-center`}
                        >
                          <p className="text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                            {t("appsCard.empty")}
                          </p>
                          <Link
                            href="/vacancies"
                            className="mt-2.5 inline-flex items-center gap-1 text-xs font-extrabold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                          >
                            <span>{t("quickActions.browseVacancies")}</span>
                            <span aria-hidden>→</span>
                          </Link>
                        </div>
                      ) : (
                        <div
                          className={`${styles.subSurface} overflow-x-auto`}
                        >
                          <table className="w-full min-w-[480px] border-collapse text-left">
                            <thead>
                              <tr className="border-b border-[#e1efe8] text-[11px] font-semibold text-[#5b796d] dark:border-[#154531] dark:text-[#88b2a0]">
                                <th className="py-2.5 pr-2 pl-3.5">
                                  {t("appsCard.colEmployer")}
                                </th>
                                <th className="px-2 py-2.5">
                                  {t("appsCard.colPosition")}
                                </th>
                                <th className="px-2 py-2.5">
                                  {t("appsCard.colStatus")}
                                </th>
                                <th className="px-2 py-2.5">
                                  {t("appsCard.colDate")}
                                </th>
                                <th className="w-8 py-2.5 pr-3 pl-1" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e4f2eb] text-xs dark:divide-[#133e2c]">
                              {recentApplications.map((app) => {
                                const badge = statusBadgeForApp(app.status);
                                return (
                                  <tr
                                    key={app.id}
                                    onClick={() =>
                                      router.push(`/vacancies/${app.vacancyId}`)
                                    }
                                    className="cursor-pointer transition-colors hover:bg-[#edf8f2] dark:hover:bg-[#0e3223]"
                                  >
                                    <td className="py-3 pr-2 pl-3.5">
                                      <div className="flex items-center gap-2.5">
                                        <CompanyBadge
                                          companyId={app.companyId}
                                          name={app.companyName}
                                          hasLogo={app.companyHasLogo}
                                          size="sm"
                                        />
                                        <span className="max-w-[130px] truncate font-bold">
                                          {app.companyName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="max-w-[150px] truncate px-2 py-3 font-semibold text-[#2a4a3d] dark:text-[#d5f2e4]">
                                      {app.position}
                                    </td>
                                    <td className="px-2 py-3">
                                      <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${badge.className}`}
                                      >
                                        {badge.label}
                                      </span>
                                    </td>
                                    <td className="px-2 py-3 whitespace-nowrap text-[#587569] dark:text-[#8eb5a4]">
                                      {app.dateLabel}
                                    </td>
                                    <td className="py-3 pr-3 pl-1 text-right text-[#6b897d] dark:text-[#7da997]">
                                      →
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </section>
                </Reveal>

                {/* 3. Saved Vacancies Card */}
                <Reveal immediate delay={150}>
                  <section
                    id="saved-vacancies-card"
                    className={`${styles.card} p-5 sm:p-6`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`${styles.iconBadge} size-9`}>
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
                          >
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("savedCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/vacancies"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("viewAll")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    {savedVacancies.length === 0 ? (
                      <div
                        className={`${styles.subSurface} mt-4 px-4 py-6 text-center`}
                      >
                        <p className="text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                          {t("savedCard.empty")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2.5">
                        {savedVacancies.slice(0, 4).map((vac) => (
                          <div
                            key={vac.vacancyId}
                            className={`${styles.subSurface} flex items-center justify-between gap-3 p-3.5 transition hover:border-[#0e935f]/35 dark:hover:border-[#34eab0]/35`}
                          >
                            <Link
                              href={`/vacancies/${vac.vacancyId}`}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <CompanyBadge
                                companyId={vac.companyId}
                                name={vac.companyName}
                                hasLogo={vac.companyHasLogo}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold">
                                  {vac.title}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-[#59776b] dark:text-[#8eb5a4]">
                                  {vac.companyName}
                                </p>
                              </div>
                            </Link>

                            <button
                              type="button"
                              disabled={removingBookmarkId === vac.vacancyId}
                              onClick={() => handleRemoveSavedVacancy(vac.vacancyId)}
                              aria-label={t("savedCard.removeAria")}
                              title={t("savedCard.removeAria")}
                              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#0c8454] transition hover:bg-[#e3f6ed] disabled:opacity-50 dark:text-[#34eab0] dark:hover:bg-[#113d2b]"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </Reveal>

                {/* 4. Recent Messages Card */}
                <Reveal immediate delay={225}>
                  <section className={`${styles.card} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`${styles.iconBadge} size-9`}>
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
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("messagesCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("viewAll")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    {recentMessages.length === 0 ? (
                      <div
                        className={`${styles.subSurface} mt-4 px-4 py-6 text-center`}
                      >
                        <p className="text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                          {t("messagesCard.empty")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 divide-y divide-[#e3f1ea] dark:divide-[#144330]">
                        {recentMessages.map((msg) => (
                          <Link
                            key={msg.id}
                            href={msg.href}
                            className="flex items-start justify-between gap-3 rounded-xl px-2 py-3.5 transition-colors first:pt-2 last:pb-2 hover:bg-[#eff9f4] dark:hover:bg-[#0c2d20]"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e4f7ee] text-xs font-extrabold text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                                {msg.initials}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold">
                                  {msg.senderName}
                                </p>
                                <p className="truncate text-xs font-bold text-[#2b4d3f] dark:text-[#cceee0]">
                                  {msg.subject}
                                </p>
                                <p className="mt-0.5 line-clamp-1 text-xs text-[#59776b] dark:text-[#8eb5a4]">
                                  {msg.snippet}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <span className="text-[11px] font-medium whitespace-nowrap text-[#638175] dark:text-[#88b2a0]">
                                {msg.timeLabel}
                              </span>
                              {msg.unread ? (
                                <span
                                  aria-label="Unread"
                                  className="size-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.75)]"
                                />
                              ) : null}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                </Reveal>
              </div>

              {/* ---------- RIGHT SUB-COLUMN ---------- */}
              <div className="space-y-5">
                {/* 1. Quick Actions Card */}
                <Reveal immediate delay={75}>
                  <section className={`${styles.card} p-5`}>
                    <div className="mb-3.5 flex items-center gap-2.5">
                      <span className={`${styles.iconBadge} size-8`}>
                        <svg
                          aria-hidden
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("quickActions.title")}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      <Link
                        href="/vacancies"
                        className={`${styles.interactiveRow} flex items-center justify-between px-3.5 py-2.5`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          {t("quickActions.browseVacancies")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/student/cv"
                        className={`${styles.interactiveRow} flex items-center justify-between px-3.5 py-2.5`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" x2="12" y1="3" y2="15" />
                          </svg>
                          {t("quickActions.updateCv")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/student/applications"
                        className={`${styles.interactiveRow} flex items-center justify-between px-3.5 py-2.5`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                          {t("quickActions.myApplications")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/chat"
                        className={`${styles.interactiveRow} flex items-center justify-between px-3.5 py-2.5`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          {t("quickActions.messages")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/student/personality"
                        className={`${styles.interactiveRow} flex items-center justify-between px-3.5 py-2.5`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
                          </svg>
                          {t("quickActions.personalityTest")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>
                    </div>
                  </section>
                </Reveal>

                {/* 2. Privacy & Security Card */}
                <Reveal immediate delay={150}>
                  <section className={`${styles.card} p-5`}>
                    <div className="mb-3.5 flex items-center gap-2.5">
                      <span className={`${styles.iconBadge} size-8`}>
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
                        >
                          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("privacyCard.title")}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setActiveModal("privacy")}
                        className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          {t("privacyCard.privacySettings")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModal("security")}
                        className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          {t("privacyCard.accountSecurity")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModal("sessions")}
                        className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="14" x="2" y="3" rx="2" />
                            <line x1="8" x2="16" y1="21" y2="21" />
                            <line x1="12" x2="12" y1="17" y2="21" />
                          </svg>
                          {t("privacyCard.activeSessions")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>
                    </div>
                  </section>
                </Reveal>

                {/* 3. Language Preference Card */}
                <Reveal immediate delay={225}>
                  <section className={`${styles.card} relative z-20 p-5`}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className={`${styles.iconBadge} size-8`}>
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
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("langCard.title")}
                      </h2>
                    </div>

                    <p className="mb-2 text-[11px] font-semibold text-[#587569] dark:text-[#8eb5a4]">
                      {t("langCard.label")}
                    </p>

                    <div ref={langRef} className="relative">
                      <button
                        type="button"
                        aria-expanded={langMenuOpen}
                        onClick={() => setLangMenuOpen((v) => !v)}
                        className={`${styles.subSurface} flex h-11 w-full cursor-pointer items-center justify-between px-3.5 text-left hover:border-[#0e935f]/45 dark:hover:border-[#34eab0]/45`}
                      >
                        <span className="flex items-center gap-2 text-xs font-bold">
                          <span className="rounded-md bg-[#e3f6ed] px-1.5 py-0.5 text-[10px] font-extrabold text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                            {currentLang.code}
                          </span>
                          <span>{currentLang.name}</span>
                        </span>
                        <svg
                          aria-hidden
                          width="13"
                          height="13"
                          viewBox="0 0 12 12"
                          className={`text-[#5b796d] transition-transform dark:text-[#8eb5a4] ${
                            langMenuOpen ? "rotate-180" : ""
                          }`}
                        >
                          <path
                            d="M3 4.5 6 7.5 9 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      </button>

                      {langMenuOpen ? (
                        <div className="absolute right-0 left-0 z-40 mt-1.5 rounded-2xl border border-[#cce7da] bg-white p-1.5 shadow-xl dark:border-[#1f6548] dark:bg-[#071f16]">
                          {routing.locales.map((loc) => {
                            const info = LOCALE_LABELS[loc] ?? {
                              code: loc.toUpperCase(),
                              name: loc,
                            };
                            const isSelected = loc === locale;
                            return (
                              <button
                                key={loc}
                                type="button"
                                onClick={() =>
                                  handleSelectLanguage(
                                    loc as "kk" | "uz" | "ru" | "en",
                                  )
                                }
                                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                                  isSelected
                                    ? "bg-[#e5f7ee] text-[#0b8051] dark:bg-[#103d2a] dark:text-[#4ade9b]"
                                    : "hover:bg-[#f3fbf7] dark:hover:bg-[#0c2d20]"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="w-6 text-[10px] font-extrabold opacity-75">
                                    {info.code}
                                  </span>
                                  <span>{info.name}</span>
                                </span>
                                {isSelected ? <span>✓</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </section>
                </Reveal>

                {/* 4. Password Card */}
                <Reveal immediate delay={225}>
                  <section className={`${styles.card} p-5`}>
                    <div className="mb-3.5 flex items-center gap-2.5">
                      <span className={`${styles.iconBadge} size-8`}>
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
                        >
                          <circle cx="7.5" cy="15.5" r="5.5" />
                          <path d="m21 2-9.6 9.6" />
                          <path d="m15.5 7.5 3 3L22 7l-3-3" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("passwordCard.title")}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveModal("password")}
                      className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left`}
                    >
                      <span className="flex items-center gap-2.5 text-xs font-bold">
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
                          className="text-[#0c8a58] dark:text-[#34eab0]"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {t("passwordCard.changePassword")}
                      </span>
                      <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                        ›
                      </span>
                    </button>
                  </section>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Full-Stack Modals */}
      {activeModal === "editProfile" ? (
        <EditProfileModal
          initial={profile}
          onClose={() => setActiveModal(null)}
          onSaved={(next) => {
            setProfile(next);
            router.refresh();
          }}
        />
      ) : null}

      {activeModal === "privacy" ? (
        <PrivacySettingsModal
          initial={privacyState}
          onClose={() => setActiveModal(null)}
          onSaved={(next) => {
            setPrivacyState(next);
            router.refresh();
          }}
        />
      ) : null}

      {activeModal === "security" ? (
        <AccountSecurityModal
          email={profile.email}
          emailVerified={emailVerified}
          createdAtLabel={accountCreatedLabel}
          onClose={() => setActiveModal(null)}
          onOpenPassword={() => setActiveModal("password")}
          onOpenSessions={() => setActiveModal("sessions")}
        />
      ) : null}

      {activeModal === "sessions" ? (
        <ActiveSessionsModal onClose={() => setActiveModal(null)} />
      ) : null}

      {activeModal === "password" ? (
        <ChangePasswordModal onClose={() => setActiveModal(null)} />
      ) : null}

      {activeModal === "weeklyPass" ? (
        <WeeklyPassModal
          onClose={() => setActiveModal(null)}
          onSubmitted={() => {
            setPendingPass(true);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
