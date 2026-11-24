import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getHowItWorksUserProgress } from "@/backend/how-it-works-state";
import { HowItWorksPanel, type HowStepItem } from "./how-it-works-panel";
import styles from "./sections.module.css";

/**
 * Section 5 — How CANDIDATOR works (Fullstack + Studio-3D).
 * Server component resolving real PostgreSQL user progress & live platform counts
 * and feeding two interactive 3D crystal-orb + Canvas refractive-ribbon panels.
 */
export async function HowItWorks({
  userId,
  userRole,
  isAuthenticated,
  activeVacancies = 0,
  visibleCvs = 0,
}: {
  userId?: string;
  userRole?: Role;
  isAuthenticated: boolean;
  activeVacancies?: number;
  visibleCvs?: number;
}) {
  const [t, progress] = await Promise.all([
    getTranslations("Landing.howItWorks"),
    getHowItWorksUserProgress(userId, userRole),
  ]);

  const completedLabel = t("completedBadge");

  const studentSteps: [HowStepItem, HowStepItem, HowStepItem] = [
    {
      href: userRole === "STUDENT" ? "/student/cv" : "/register?role=STUDENT",
      title: t("s1Title"),
      desc: t("s1Desc"),
      actionLabel: t("actionStudent1"),
      stepBadge: t("stepBadge", { current: 1 }),
      liveBadge: null,
      completed: userRole === "STUDENT" && progress.studentHasCv,
      completedLabel,
      icon: "user",
    },
    {
      href: "/vacancies",
      title: t("s2Title"),
      desc: t("s2Desc"),
      actionLabel: t("actionStudent2"),
      stepBadge: t("stepBadge", { current: 2 }),
      liveBadge:
        activeVacancies > 0
          ? t("liveVacancies", { count: activeVacancies })
          : null,
      completed: false,
      completedLabel,
      icon: "search",
    },
    {
      href:
        userRole === "STUDENT" && progress.studentApplicationCount > 0
          ? "/student/applications"
          : "/vacancies",
      title: t("s3Title"),
      desc: t("s3Desc"),
      actionLabel: t("actionStudent3"),
      stepBadge: t("stepBadge", { current: 3 }),
      liveBadge:
        userRole === "STUDENT" && progress.studentApplicationCount > 0
          ? t("liveApplications", { count: progress.studentApplicationCount })
          : null,
      completed:
        userRole === "STUDENT" && progress.studentApplicationCount > 0,
      completedLabel,
      icon: "send",
    },
  ];

  const employerSteps: [HowStepItem, HowStepItem, HowStepItem] = [
    {
      href:
        userRole === "COMPANY"
          ? "/company/vacancies/new"
          : "/register?role=COMPANY",
      title: t("e1Title"),
      desc: t("e1Desc"),
      actionLabel: t("actionEmployer1"),
      stepBadge: t("stepBadge", { current: 1 }),
      liveBadge:
        userRole === "COMPANY" && progress.companyVacancyCount > 0
          ? t("liveVacancies", { count: progress.companyVacancyCount })
          : null,
      completed: userRole === "COMPANY" && progress.companyVacancyCount > 0,
      completedLabel,
      icon: "document",
    },
    {
      href:
        userRole === "COMPANY"
          ? "/company/students"
          : "/register?role=COMPANY",
      title: t("e2Title"),
      desc: t("e2Desc"),
      actionLabel: t("actionEmployer2"),
      stepBadge: t("stepBadge", { current: 2 }),
      liveBadge:
        visibleCvs > 0 ? t("liveProfiles", { count: visibleCvs }) : null,
      completed: false,
      completedLabel,
      icon: "users",
    },
    {
      href: isAuthenticated ? "/chat" : "/support",
      title: t("e3Title"),
      desc: t("e3Desc"),
      actionLabel: t("actionEmployer3"),
      stepBadge: t("stepBadge", { current: 3 }),
      liveBadge:
        userRole === "COMPANY" && progress.companyActiveChatCount > 0
          ? t("liveChats", { count: progress.companyActiveChatCount })
          : null,
      completed: userRole === "COMPANY" && progress.companyActiveChatCount > 0,
      completedLabel,
      icon: "handshake",
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-16 sm:py-20"
    >
      <div className={styles.sectionWrap}>
        <h2
          id="how-it-works-heading"
          className={`${styles.sectionHeading} text-center`}
        >
          {t("title")}
        </h2>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
          <HowItWorksPanel
            heading={t("studentsHeading")}
            subtitle={t("studentsSubtitle")}
            headerIcon="graduation"
            steps={studentSteps}
            phaseOffset={0}
          />
          <HowItWorksPanel
            heading={t("employersHeading")}
            subtitle={t("employersSubtitle")}
            headerIcon="briefcase"
            steps={employerSteps}
            phaseOffset={0.45}
          />
        </div>
      </div>
    </section>
  );
}
