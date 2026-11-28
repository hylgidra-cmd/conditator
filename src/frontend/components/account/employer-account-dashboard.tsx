"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { postJson, requestJson } from "@/backend/client/api";
import { FREE_ACCESS_MODE } from "@/backend/payment/free-mode";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import { Link, useRouter } from "@/i18n/navigation";
import {
  CompanySubscriptionModal,
  EditCompanyModal,
  type EmployerCompanyState,
  type EmployerModalType,
  TwoStepSecurityModal,
  VerificationDetailsModal,
} from "./employer-account-modals";
import styles from "./student-account.module.css";
import {
  ActiveSessionsModal,
  ChangePasswordModal,
} from "./student-account-modals";

export type EmployerVacancyRow = {
  id: string;
  title: string;
  location: string | null;
  workType: "FULL_TIME" | "PART_TIME" | "REMOTE" | "INTERNSHIP" | null;
  status: "ACTIVE" | "CLOSED" | "CANCELLED";
};

export type EmployerApplicantRow = {
  id: string;
  vacancyId: string;
  cvId: string;
  applicantName: string;
  initials: string;
  roleTitle: string;
  skills: string[];
  appliedDateLabel: string;
  stageBadge: "NEW" | "IN_REVIEW" | "INTERVIEW" | "ACCEPTED" | "REJECTED";
};

export type EmployerMessageRow = {
  id: string;
  href: string;
  senderName: string;
  initials: string;
  subject: string;
  snippet: string;
  timeLabel: string;
  unread: boolean;
};

export type EmployerAccountDashboardProps = {
  accountEmail: string;
  initialCompany: EmployerCompanyState;
  approval: "APPROVED" | "PENDING" | "REJECTED";
  approvedAtLabel: string | null;
  initialTwoFactorEnabled: boolean;
  stats: {
    unreadMessages: number;
    newCount: number;
    inReviewCount: number;
    interviewCount: number;
    decisionCount: number;
  };
  subscription: {
    active: boolean;
    planName: string;
    expiresLabel: string | null;
    pendingPayment: boolean;
  };
  initialVacancies: EmployerVacancyRow[];
  totalActiveVacancies: number;
  recentApplicants: EmployerApplicantRow[];
  recentMessages: EmployerMessageRow[];
};

const SKILL_PILL_TONES = [
  "bg-[#e3f1fe] text-[#1a62bd] dark:bg-[#102b47] dark:text-[#6eb4ff]",
  "bg-[#efe8fe] text-[#6a35d4] dark:bg-[#231744] dark:text-[#b490ff]",
  "bg-[#dff6ea] text-[#0c7e50] dark:bg-[#0f3a28] dark:text-[#4ade9b]",
  "bg-[#fef2d6] text-[#9e640c] dark:bg-[#38290d] dark:text-[#f6be4f]",
] as const;

function normalizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function EmployerAccountDashboard({
  accountEmail,
  initialCompany,
  approval,
  approvedAtLabel,
  initialTwoFactorEnabled,
  stats,
  subscription,
  initialVacancies,
  totalActiveVacancies,
  recentApplicants,
  recentMessages,
}: EmployerAccountDashboardProps) {
  const t = useTranslations("EmployerAccount");
  const router = useRouter();

  const [company, setCompany] = useState<EmployerCompanyState>(initialCompany);
  const [vacancies, setVacancies] =
    useState<EmployerVacancyRow[]>(initialVacancies);
  const [activeVacancyCount, setActiveVacancyCount] =
    useState<number>(totalActiveVacancies);
  const [togglingVacancyId, setTogglingVacancyId] = useState<string | null>(
    null,
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    initialTwoFactorEnabled,
  );
  const [pendingSub, setPendingSub] = useState(subscription.pendingPayment);
  const [activeModal, setActiveModal] = useState<EmployerModalType>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);

  const emailPrefix = accountEmail.split("@")[0] ?? accountEmail;
  const fallbackName =
    emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  const displayName = company.name.trim() || fallbackName;
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  // Kompaniya profili to'ldirilganligi (4 mezon × 25% = 100%)
  const hasLogo = company.hasLogo && !logoImgError;
  const hasDescription = Boolean(company.description.trim());
  const hasContacts = Boolean(
    (company.city.trim() || company.country.trim()) &&
      (company.contactEmail.trim() || accountEmail),
  );
  const isVerified = approval === "APPROVED";

  const completionChecks = [
    {
      key: "logo",
      label: t("completion.logo"),
      done: hasLogo,
      onClick: () => setActiveModal("editCompany"),
    },
    {
      key: "description",
      label: t("completion.description"),
      done: hasDescription,
      onClick: () => setActiveModal("editCompany"),
    },
    {
      key: "contacts",
      label: t("completion.contacts"),
      done: hasContacts,
      onClick: () => setActiveModal("editCompany"),
    },
    {
      key: "verification",
      label: t("completion.verification"),
      done: isVerified,
      onClick: () => setActiveModal("verification"),
    },
  ];
  const completedCount = completionChecks.filter((c) => c.done).length;
  const completionPct = completedCount * 25;
  const ringRadius = 27;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset =
    ringCircumference - (completionPct / 100) * ringCircumference;

  async function handleToggleVacancyStatus(row: EmployerVacancyRow) {
    if (togglingVacancyId) return;
    const nextStatus: "ACTIVE" | "CLOSED" =
      row.status === "ACTIVE" ? "CLOSED" : "ACTIVE";

    setTogglingVacancyId(row.id);
    const prevVacancies = vacancies;
    const prevCount = activeVacancyCount;

    setVacancies((list) =>
      list.map((v) => (v.id === row.id ? { ...v, status: nextStatus } : v)),
    );
    setActiveVacancyCount((c) =>
      nextStatus === "ACTIVE" ? c + 1 : Math.max(0, c - 1),
    );

    const res = await requestJson(
      "PATCH",
      `/api/vacancies/${encodeURIComponent(row.id)}/status`,
      { status: nextStatus },
    );
    setTogglingVacancyId(null);

    if (!res.ok) {
      setVacancies(prevVacancies);
      setActiveVacancyCount(prevCount);
    } else {
      router.refresh();
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await postJson("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  function workTypeLabel(
    wt: EmployerVacancyRow["workType"],
  ): string {
    if (!wt) return t("workTypes.FULL_TIME");
    return t(`workTypes.${wt}`);
  }

  function applicantBadgeStyle(
    stage: EmployerApplicantRow["stageBadge"],
  ): { label: string; className: string } {
    if (stage === "NEW") {
      return {
        label: t("stages.new"),
        className:
          "bg-[#e3f1fe] text-[#1a62bd] border border-[#bfdcf9] dark:bg-[#102b47] dark:text-[#6eb4ff] dark:border-[#1e4d7b]",
      };
    }
    if (stage === "IN_REVIEW") {
      return {
        label: t("stages.inReview"),
        className:
          "bg-[#fef2d6] text-[#9e640c] border border-[#f5dca3] dark:bg-[#3a2a0d] dark:text-[#f6be4f] dark:border-[#664914]",
      };
    }
    if (stage === "INTERVIEW") {
      return {
        label: t("stages.interview"),
        className:
          "bg-[#dff6ea] text-[#0c7e50] border border-[#b4e8cd] dark:bg-[#0f3a28] dark:text-[#4ade9b] dark:border-[#1d6849]",
      };
    }
    if (stage === "REJECTED") {
      return {
        label: t("stages.rejected"),
        className:
          "bg-[#fee6e6] text-[#b82e2e] border border-[#f9c4c4] dark:bg-[#3b1518] dark:text-[#f88080] dark:border-[#692429]",
      };
    }
    return {
      label: t("stages.accepted"),
      className:
        "bg-[#dff6ea] text-[#0c7e50] border border-[#b4e8cd] dark:bg-[#0f3a28] dark:text-[#4ade9b] dark:border-[#1d6849]",
    };
  }

  const candidatesInReviewTotal =
    stats.inReviewCount + stats.interviewCount;

  return (
    <div className={`${styles.stage} font-ui`}>
      <div aria-hidden className={styles.bgTopLayer} />
      <div aria-hidden className={styles.bgBottomLayer} />
      <div aria-hidden className={styles.ambientGlow} />

      <div className="mx-auto max-w-[1380px] px-4 pt-7 pb-14 sm:px-7 lg:px-11 lg:pt-9 lg:pb-16">
        {/* Hero Greeting */}
        <Reveal immediate>
          <header className="mb-7 max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#557367] uppercase dark:text-[#8eb5a4]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1.5 text-[28px] leading-[1.15] font-extrabold tracking-tight text-[#0b1f17] sm:text-[36px] dark:text-[#f3fbf7]">
              {t("greeting", { name: displayName })}{" "}
              <span aria-hidden className={styles.waveHand}>
                👋
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#4f6d61] sm:text-[15px] dark:text-[#98beae]">
              {t("heroSubtitle")}
            </p>
          </header>
        </Reveal>

        {/* Main 2-Zone Layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[276px_minmax(0,1fr)] xl:grid-cols-[292px_minmax(0,1fr)]">
          {/* ================= LEFT SIDEBAR COLUMN ================= */}
          <div className="space-y-5">
            {/* 1. Company Identity Card */}
            <Reveal immediate>
              <section className={`${styles.card} p-5 text-center sm:p-6`}>
                <div className="mx-auto flex justify-center">
                  <div className={styles.avatarBox}>
                    {company.hasLogo && !logoImgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/companies/${company.id}/logo?v=${company.logoVersion}`}
                        alt={displayName}
                        onError={() => setLogoImgError(true)}
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
                  {company.industry.trim() || t("defaultIndustry")}
                </p>

                <div className="mt-3 flex justify-center">
                  {approval === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c3e8d7] bg-[#e6f7ef] px-3 py-1 text-[11px] font-bold text-[#0b7e50] dark:border-[#1d6849] dark:bg-[#0d3324] dark:text-[#4ade9b]">
                      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#0d945f] text-[10px] text-white dark:bg-[#25d38f] dark:text-[#042417]">
                        ✓
                      </span>
                      {t("verifiedBadge")}
                    </span>
                  ) : approval === "PENDING" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f2d699] bg-[#fef3d6] px-3 py-1 text-[11px] font-bold text-[#9a630e] dark:border-[#684a14] dark:bg-[#38290d] dark:text-[#f6be4f]">
                      ⏳ {t("pendingBadge")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f9c4c4] bg-[#fee6e6] px-3 py-1 text-[11px] font-bold text-[#b82e2e] dark:border-[#692429] dark:bg-[#3b1518] dark:text-[#f88080]">
                      ✕ {t("rejectedBadge")}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal("editCompany")}
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
                    <span>{t("editCompanyProfile")}</span>
                  </button>

                  <Link
                    href="/company"
                    className={`${styles.primaryBtn} h-10 w-full text-xs`}
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
                    >
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                    </svg>
                    <span>{t("viewCompanyPage")}</span>
                  </Link>
                </div>
              </section>
            </Reveal>

            {/* 2. Company Details Card */}
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
                      <line x1="3" x2="21" y1="22" y2="22" />
                      <line x1="6" x2="6" y1="18" y2="11" />
                      <line x1="10" x2="10" y1="18" y2="11" />
                      <line x1="14" x2="14" y1="18" y2="11" />
                      <line x1="18" x2="18" y1="18" y2="11" />
                      <polygon points="12 2 20 7 4 7" />
                    </svg>
                  </span>
                  <h2 className="text-[15px] font-extrabold tracking-tight">
                    {t("companyDetails")}
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
                        {t("fields.industry")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold break-words">
                        {company.industry.trim() || (
                          <button
                            type="button"
                            onClick={() => setActiveModal("editCompany")}
                            className="cursor-pointer text-xs font-semibold text-[#0c8a58] hover:underline dark:text-[#34eab0]"
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
                        {company.city.trim() || company.country.trim() || (
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
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.website")}
                      </dt>
                      <dd className="mt-0.5 truncate text-[13px] font-bold">
                        {company.website.trim() ? (
                          <a
                            href={normalizeExternalUrl(company.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#0c8a58] hover:underline dark:hover:text-[#34eab0]"
                          >
                            {company.website.trim()}
                          </a>
                        ) : (
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
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.contactEmail")}
                      </dt>
                      <dd className="mt-0.5 truncate text-[13px] font-bold">
                        {company.contactEmail.trim() || accountEmail}
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-medium text-[#5c7a6e] dark:text-[#8eb5a4]">
                        {t("fields.teamSize")}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-bold">
                        {company.size.trim() ? (
                          t("teamEmployees", { size: company.size })
                        ) : (
                          <span className="font-medium text-[#6f8b80] dark:text-[#7ca594]">
                            {t("notSpecified")}
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>
                </dl>
              </section>
            </Reveal>

            {/* 3. Company Profile Completion Card */}
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
                    <h2 className="text-[14px] leading-snug font-extrabold tracking-tight">
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
                  onClick={() => setActiveModal("editCompany")}
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
            {/* Top Row: 4 KPI Stat Cards */}
            <Reveal immediate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Link
                  href="/company/vacancies"
                  className={`${styles.kpiCard} flex items-center justify-between p-4`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${styles.iconBadge} size-10 shrink-0`}>
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
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.activeVacancies")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={activeVacancyCount} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </Link>

                <Link
                  href="/company/vacancies"
                  className={`${styles.kpiCard} flex items-center justify-between p-4`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${styles.iconBadge} size-10 shrink-0`}>
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
                        <line x1="22" x2="11" y1="2" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.newApplications")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={stats.newCount} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </Link>

                <Link
                  href="/company/vacancies"
                  className={`${styles.kpiCard} flex items-center justify-between p-4`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${styles.iconBadge} size-10 shrink-0`}>
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
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-[#547165] dark:text-[#8eb5a4]">
                        {t("kpi.candidatesInReview")}
                      </p>
                      <p className="mt-0.5 text-2xl leading-tight font-extrabold">
                        <AnimatedNumber value={candidatesInReviewTotal} />
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#6f8d81] dark:text-[#7da997]">
                    ›
                  </span>
                </Link>

                <Link
                  href="/chat"
                  className={`${styles.kpiCard} flex items-center justify-between p-4`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${styles.iconBadge} size-10 shrink-0`}>
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
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11.5px] font-semibold text-[#547165] dark:text-[#8eb5a4]">
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

            {/* Inner 2-Column Grid */}
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.68fr)_minmax(265px,1fr)]">
              {/* ---------- CENTER SUB-COLUMN ---------- */}
              <div className="space-y-5">
                {/* 1. Active Vacancies Card */}
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
                          {t("vacanciesCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/company/vacancies"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("viewAll")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    {vacancies.length === 0 ? (
                      <div
                        className={`${styles.subSurface} mt-4 px-4 py-7 text-center`}
                      >
                        <p className="text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                          {t("vacanciesCard.empty")}
                        </p>
                        <Link
                          href="/company/vacancies/new"
                          className={`${styles.primaryBtn} mt-3.5 h-9 px-4 text-xs`}
                        >
                          <span>+ {t("quickActions.postVacancy")}</span>
                        </Link>
                      </div>
                    ) : (
                      <div className={`${styles.subSurface} mt-4 overflow-x-auto`}>
                        <table className="w-full min-w-[560px] border-collapse text-left">
                          <thead>
                            <tr className="border-b border-[#e1efe8] text-[11px] font-semibold text-[#5b796d] dark:border-[#154531] dark:text-[#88b2a0]">
                              <th className="py-2.5 pr-2 pl-3.5">
                                {t("vacanciesCard.colTitle")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("vacanciesCard.colLocation")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("vacanciesCard.colType")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("vacanciesCard.colStatus")}
                              </th>
                              <th className="py-2.5 pr-3.5 pl-2">
                                {t("vacanciesCard.colActions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e4f2eb] text-xs dark:divide-[#133e2c]">
                            {vacancies.map((vac) => {
                              const isActive = vac.status === "ACTIVE";
                              return (
                                <tr
                                  key={vac.id}
                                  className="transition-colors hover:bg-[#edf8f2] dark:hover:bg-[#0e3223]"
                                >
                                  <td className="max-w-[165px] truncate py-3 pr-2 pl-3.5 font-extrabold">
                                    <Link
                                      href={`/company/vacancies/${vac.id}`}
                                      className="hover:text-[#0c8a58] dark:hover:text-[#34eab0]"
                                    >
                                      {vac.title}
                                    </Link>
                                  </td>
                                  <td className="px-2 py-3 whitespace-nowrap text-[#4a695c] dark:text-[#b2d9c8]">
                                    <span className="inline-flex items-center gap-1">
                                      <svg
                                        aria-hidden
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-[#0c8a58] dark:text-[#34eab0]"
                                      >
                                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                        <circle cx="12" cy="10" r="3" />
                                      </svg>
                                      <span className="max-w-[105px] truncate">
                                        {vac.location?.trim() || t("workTypes.REMOTE")}
                                      </span>
                                    </span>
                                  </td>
                                  <td className="px-2 py-3 whitespace-nowrap text-[#4a695c] dark:text-[#b2d9c8]">
                                    <span className="inline-flex items-center gap-1">
                                      <svg
                                        aria-hidden
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <rect width="20" height="14" x="2" y="7" rx="2" />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                      </svg>
                                      <span>{workTypeLabel(vac.workType)}</span>
                                    </span>
                                  </td>
                                  <td className="px-2 py-3">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        isActive
                                          ? "border border-[#b4e8cd] bg-[#dff6ea] text-[#0c7e50] dark:border-[#1d6849] dark:bg-[#0f3a28] dark:text-[#4ade9b]"
                                          : "border border-[#f5dca3] bg-[#fef2d6] text-[#9e640c] dark:border-[#664914] dark:bg-[#3a2a0d] dark:text-[#f6be4f]"
                                      }`}
                                    >
                                      {isActive
                                        ? t("vacanciesCard.statusActive")
                                        : t("vacanciesCard.statusPaused")}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-3.5 pl-2">
                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        href={`/company/vacancies/${vac.id}`}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#d4eae0] bg-white px-2.5 text-[11px] font-bold text-[#264639] transition hover:border-[#0e935f] dark:border-[#1f5f45] dark:bg-[#082017] dark:text-[#cceee0] dark:hover:border-[#34eab0]"
                                      >
                                        <svg
                                          aria-hidden
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                        <span>{t("vacanciesCard.editBtn")}</span>
                                      </Link>

                                      <Link
                                        href={`/company/vacancies/${vac.id}/matches`}
                                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#d4eae0] bg-white px-2.5 text-[11px] font-bold text-[#264639] transition hover:border-[#0e935f] dark:border-[#1f5f45] dark:bg-[#082017] dark:text-[#cceee0] dark:hover:border-[#34eab0]"
                                      >
                                        <svg
                                          aria-hidden
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                          <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        <span>{t("vacanciesCard.viewBtn")}</span>
                                      </Link>

                                      <button
                                        type="button"
                                        disabled={togglingVacancyId === vac.id}
                                        onClick={() =>
                                          handleToggleVacancyStatus(vac)
                                        }
                                        aria-label={
                                          isActive
                                            ? t("vacanciesCard.pauseAria")
                                            : t("vacanciesCard.resumeAria")
                                        }
                                        title={
                                          isActive
                                            ? t("vacanciesCard.pauseAria")
                                            : t("vacanciesCard.resumeAria")
                                        }
                                        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#d4eae0] bg-white text-[#264639] transition hover:border-[#0e935f] hover:text-[#0b8455] disabled:opacity-50 dark:border-[#1f5f45] dark:bg-[#082017] dark:text-[#cceee0] dark:hover:border-[#34eab0]"
                                      >
                                        {isActive ? (
                                          <svg
                                            width="11"
                                            height="11"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                          >
                                            <rect width="5" height="16" x="5" y="4" rx="1" />
                                            <rect width="5" height="16" x="14" y="4" rx="1" />
                                          </svg>
                                        ) : (
                                          <svg
                                            width="11"
                                            height="11"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="text-[#0c8a58] dark:text-[#34eab0]"
                                          >
                                            <polygon points="6 4 20 12 6 20 6 4" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </Reveal>

                {/* 2. Applicant Pipeline Overview Card */}
                <Reveal immediate delay={150}>
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
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("pipelineCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/company/vacancies"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("pipelineCard.viewApplications")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-2.5">
                      <div className="relative flex items-center gap-2">
                        <div className={`${styles.subSurface} flex h-full w-full flex-col justify-between p-3.5`}>
                          <div>
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#e3f7ee] text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.1"
                              >
                                <line x1="22" x2="11" y1="2" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </span>
                            <p className="mt-2 text-xs font-semibold text-[#557266] dark:text-[#92bba9]">
                              {t("stages.new")}
                            </p>
                          </div>
                          <p className="mt-1.5 text-xl font-extrabold">
                            <AnimatedNumber value={stats.newCount} />
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className="hidden text-xs font-bold text-[#7ca091] sm:inline"
                        >
                          →
                        </span>
                      </div>

                      <div className="relative flex items-center gap-2">
                        <div className={`${styles.subSurface} flex h-full w-full flex-col justify-between p-3.5`}>
                          <div>
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#fef2d6] text-[#b8740e] dark:bg-[#38290d] dark:text-[#f6be4f]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.1"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </span>
                            <p className="mt-2 text-xs font-semibold text-[#557266] dark:text-[#92bba9]">
                              {t("stages.inReview")}
                            </p>
                          </div>
                          <p className="mt-1.5 text-xl font-extrabold">
                            <AnimatedNumber value={stats.inReviewCount} />
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className="hidden text-xs font-bold text-[#7ca091] sm:inline"
                        >
                          →
                        </span>
                      </div>

                      <div className="relative flex items-center gap-2">
                        <div className={`${styles.subSurface} flex h-full w-full flex-col justify-between p-3.5`}>
                          <div>
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#e3f7ee] text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.1"
                              >
                                <rect width="18" height="18" x="3" y="4" rx="2" />
                                <line x1="16" x2="16" y1="2" y2="6" />
                                <line x1="8" x2="8" y1="2" y2="6" />
                                <line x1="3" x2="21" y1="10" y2="10" />
                              </svg>
                            </span>
                            <p className="mt-2 text-xs font-semibold text-[#557266] dark:text-[#92bba9]">
                              {t("stages.interview")}
                            </p>
                          </div>
                          <p className="mt-1.5 text-xl font-extrabold">
                            <AnimatedNumber value={stats.interviewCount} />
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className="hidden text-xs font-bold text-[#7ca091] sm:inline"
                        >
                          →
                        </span>
                      </div>

                      <div className={`${styles.subSurface} flex h-full w-full flex-col justify-between p-3.5`}>
                        <div>
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#e3f7ee] text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                          <p className="mt-2 text-xs font-semibold text-[#557266] dark:text-[#92bba9]">
                            {t("stages.decision")}
                          </p>
                        </div>
                        <p className="mt-1.5 text-xl font-extrabold">
                          <AnimatedNumber value={stats.decisionCount} />
                        </p>
                      </div>
                    </div>
                  </section>
                </Reveal>

                {/* 3. Recent Applicants Card */}
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
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                        </span>
                        <h2 className="text-base font-extrabold tracking-tight">
                          {t("applicantsCard.title")}
                        </h2>
                      </div>

                      <Link
                        href="/company/students"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c8454] hover:underline dark:text-[#34eab0]"
                      >
                        <span>{t("viewAll")}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    </div>

                    {recentApplicants.length === 0 ? (
                      <div
                        className={`${styles.subSurface} mt-4 px-4 py-7 text-center`}
                      >
                        <p className="text-xs font-medium text-[#587569] dark:text-[#8eb5a4]">
                          {t("applicantsCard.empty")}
                        </p>
                      </div>
                    ) : (
                      <div className={`${styles.subSurface} mt-4 overflow-x-auto`}>
                        <table className="w-full min-w-[540px] border-collapse text-left">
                          <thead>
                            <tr className="border-b border-[#e1efe8] text-[11px] font-semibold text-[#5b796d] dark:border-[#154531] dark:text-[#88b2a0]">
                              <th className="py-2.5 pr-2 pl-3.5">
                                {t("applicantsCard.colApplicant")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("applicantsCard.colRole")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("applicantsCard.colSkills")}
                              </th>
                              <th className="px-2 py-2.5">
                                {t("applicantsCard.colAppliedOn")}
                              </th>
                              <th className="py-2.5 pr-3.5 pl-2">
                                {t("applicantsCard.colStatus")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e4f2eb] text-xs dark:divide-[#133e2c]">
                            {recentApplicants.map((app) => {
                              const badge = applicantBadgeStyle(app.stageBadge);
                              return (
                                <tr
                                  key={app.id}
                                  onClick={() =>
                                    router.push(
                                      `/company/vacancies/${app.vacancyId}/candidates/${app.cvId}`,
                                    )
                                  }
                                  className="cursor-pointer transition-colors hover:bg-[#edf8f2] dark:hover:bg-[#0e3223]"
                                >
                                  <td className="py-3 pr-2 pl-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e3f7ee] text-[11px] font-extrabold text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
                                        {app.initials}
                                      </span>
                                      <span className="max-w-[115px] truncate font-extrabold">
                                        {app.applicantName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="max-w-[140px] truncate px-2 py-3 font-semibold text-[#2a4a3d] dark:text-[#d5f2e4]">
                                    {app.roleTitle}
                                  </td>
                                  <td className="px-2 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {app.skills.slice(0, 2).map((sk, idx) => (
                                        <span
                                          key={sk}
                                          className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                                            SKILL_PILL_TONES[
                                              idx % SKILL_PILL_TONES.length
                                            ]
                                          }`}
                                        >
                                          {sk}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-2 py-3 whitespace-nowrap text-[#587569] dark:text-[#8eb5a4]">
                                    {app.appliedDateLabel}
                                  </td>
                                  <td className="py-3 pr-3.5 pl-2">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${badge.className}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </Reveal>

                {/* 4. Recent Company Messages Card */}
                <Reveal immediate delay={300}>
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
                              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e4f7ee] text-xs font-extrabold text-[#0b8455] dark:bg-[#113d2b] dark:text-[#34eab0]">
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

                    <Link
                      href="/company/vacancies/new"
                      className={`${styles.primaryBtn} mb-2.5 h-10 w-full text-xs`}
                    >
                      <span className="text-base leading-none font-bold">+</span>
                      <span>{t("quickActions.postVacancy")}</span>
                    </Link>

                    <div className="space-y-2">
                      <Link
                        href="/company/vacancies"
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="14" x="2" y="7" rx="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          {t("quickActions.manageVacancies")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/company/students"
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {t("quickActions.reviewApplications")}
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          {t("quickActions.openMessages")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>

                      <Link
                        href="/company/stats"
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <line x1="18" x2="18" y1="20" y2="10" />
                            <line x1="12" x2="12" y1="20" y2="4" />
                            <line x1="6" x2="6" y1="20" y2="14" />
                          </svg>
                          {t("quickActions.analytics")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </Link>
                    </div>
                  </section>
                </Reveal>

                {/* 2. Subscription Plan Card */}
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
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("subscriptionCard.title")}
                      </h2>
                    </div>

                    <div className={`${styles.passBanner} p-4`}>
                      <p className="text-base font-extrabold">
                        {subscription.active
                          ? subscription.planName
                          : pendingSub
                            ? t("subscriptionCard.pendingTitle")
                            : t("subscriptionCard.freeTitle")}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-bold ${
                          subscription.active
                            ? "text-[#0c8454] dark:text-[#4ade9b]"
                            : pendingSub
                              ? "text-[#9a630e] dark:text-[#f6be4f]"
                              : "text-[#547165] dark:text-[#8eb5a4]"
                        }`}
                      >
                        {subscription.active
                          ? t("subscriptionCard.active")
                          : pendingSub
                            ? t("subscriptionCard.pending")
                            : t("subscriptionCard.inactive")}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#557367] dark:text-[#8eb5a4]">
                      <svg
                        aria-hidden
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      <span>
                        {FREE_ACCESS_MODE
                          ? "Barcha imkoniyatlar vaqtincha BEPUL"
                          : subscription.active && subscription.expiresLabel
                            ? t("subscriptionCard.expires", {
                                date: subscription.expiresLabel,
                              })
                            : t("subscriptionCard.fromPrice")}
                      </span>
                    </div>

                    {!FREE_ACCESS_MODE ? (
                      <button
                        type="button"
                        onClick={() => setActiveModal("subscription")}
                        className="mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#bce3d1] bg-[#f4fbf7] text-xs font-extrabold text-[#0c3f2c] transition hover:border-[#0e935f] hover:bg-[#e6f7ef] dark:border-[#1f6548] dark:bg-[#0b291d] dark:text-[#dff8ec] dark:hover:border-[#34eab0]"
                      >
                        <span>{t("subscriptionCard.manageBtn")}</span>
                        <span aria-hidden>→</span>
                      </button>
                    ) : null}
                  </section>
                </Reveal>

                {/* 3. Verification Card */}
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
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("verificationCard.title")}
                      </h2>
                    </div>

                    <div
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-extrabold ${
                        approval === "APPROVED"
                          ? "border-[#bfe8d4] bg-[#e6f7ef] text-[#0b7e50] dark:border-[#1e6a4a] dark:bg-[#0d3525] dark:text-[#4ade9b]"
                          : approval === "PENDING"
                            ? "border-[#f2d699] bg-[#fef3d6] text-[#9a630e] dark:border-[#684a14] dark:bg-[#38290d] dark:text-[#f6be4f]"
                            : "border-[#f9c4c4] bg-[#fee6e6] text-[#b82e2e] dark:border-[#692429] dark:bg-[#3b1518] dark:text-[#f88080]"
                      }`}
                    >
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0e9962] text-[11px] text-white dark:bg-[#24d28e] dark:text-[#042417]">
                        {approval === "APPROVED"
                          ? "✓"
                          : approval === "PENDING"
                            ? "⏳"
                            : "!"}
                      </span>
                      <span>
                        {approval === "APPROVED"
                          ? t("verificationCard.verified")
                          : approval === "PENDING"
                            ? t("verificationCard.pending")
                            : t("verificationCard.rejected")}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-[#557367] dark:text-[#8eb5a4]">
                      {approval === "APPROVED"
                        ? t("verificationCard.verifiedDesc")
                        : t("verificationCard.pendingDesc")}
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveModal("verification")}
                      className="mt-3.5 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#bce3d1] bg-[#f4fbf7] text-xs font-extrabold text-[#0c3f2c] transition hover:border-[#0e935f] hover:bg-[#e6f7ef] dark:border-[#1f6548] dark:bg-[#0b291d] dark:text-[#dff8ec] dark:hover:border-[#34eab0]"
                    >
                      <span>{t("verificationCard.detailsBtn")}</span>
                      <span aria-hidden>→</span>
                    </button>
                  </section>
                </Reveal>

                {/* 4. Account Security Card */}
                <Reveal immediate delay={300}>
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
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <h2 className="text-[15px] font-extrabold tracking-tight">
                        {t("securityCard.title")}
                      </h2>
                    </div>

                    <div className="space-y-2">
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <circle cx="7.5" cy="15.5" r="5.5" />
                            <path d="m21 2-9.6 9.6" />
                            <path d="m15.5 7.5 3 3L22 7l-3-3" />
                          </svg>
                          {t("securityCard.changePassword")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModal("twoFactor")}
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          <span>{t("securityCard.twoFactor")}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          {twoFactorEnabled ? (
                            <span className="rounded-full bg-[#e2f7ec] px-2 py-0.5 text-[10px] font-bold text-[#0b7f51] dark:bg-[#11422e] dark:text-[#4ade9b]">
                              ON
                            </span>
                          ) : null}
                          <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                            ›
                          </span>
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
                            className="text-[#0c8a58] dark:text-[#34eab0]"
                          >
                            <rect width="20" height="14" x="2" y="3" rx="2" />
                            <line x1="8" x2="16" y1="21" y2="21" />
                            <line x1="12" x2="12" y1="17" y2="21" />
                          </svg>
                          {t("securityCard.activeSessions")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={signingOut}
                        onClick={handleSignOut}
                        className={`${styles.interactiveRow} flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left disabled:opacity-60`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold text-red-600 dark:text-red-400">
                          <svg
                            aria-hidden
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" x2="9" y1="12" y2="12" />
                          </svg>
                          {signingOut
                            ? t("securityCard.signingOut")
                            : t("securityCard.signOut")}
                        </span>
                        <span className="text-sm text-[#6b897d] dark:text-[#7da997]">
                          ›
                        </span>
                      </button>
                    </div>
                  </section>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      {activeModal === "editCompany" ? (
        <EditCompanyModal
          initial={company}
          accountEmail={accountEmail}
          onClose={() => setActiveModal(null)}
          onSaved={(next) => {
            setLogoImgError(false);
            setCompany(next);
            router.refresh();
          }}
        />
      ) : null}

      {activeModal === "subscription" ? (
        <CompanySubscriptionModal
          onClose={() => setActiveModal(null)}
          onSubmitted={() => {
            setPendingSub(true);
            router.refresh();
          }}
        />
      ) : null}

      {activeModal === "verification" ? (
        <VerificationDetailsModal
          approval={approval}
          approvedAtLabel={approvedAtLabel}
          companyName={displayName}
          onClose={() => setActiveModal(null)}
        />
      ) : null}

      {activeModal === "twoFactor" ? (
        <TwoStepSecurityModal
          initialEnabled={twoFactorEnabled}
          email={accountEmail}
          onClose={() => setActiveModal(null)}
          onChanged={(next) => {
            setTwoFactorEnabled(next);
            router.refresh();
          }}
        />
      ) : null}

      {activeModal === "password" ? (
        <ChangePasswordModal onClose={() => setActiveModal(null)} />
      ) : null}

      {activeModal === "sessions" ? (
        <ActiveSessionsModal onClose={() => setActiveModal(null)} />
      ) : null}
    </div>
  );
}
