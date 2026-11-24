import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import {
  type JourneyStepItem,
  StudentJourneyTrack,
} from "./student-journey-track";
import styles from "./sections.module.css";

/**
 * Section 3 — Student Journey.
 * Matches the approved horizontal 3-part composition:
 * Left copy + CTA | Center-left local student girl | Right ascending emerald glass rail with 4 looping crystal tiles.
 */
export async function StudentJourney({ userRole }: { userRole?: Role }) {
  const t = await getTranslations("Landing.studentJourney");

  const startHref =
    userRole === "STUDENT" ? "/student/cv" : "/register?role=STUDENT";
  const profileHref =
    userRole === "STUDENT" ? "/student/cv" : "/register?role=STUDENT";
  const skillsHref =
    userRole === "STUDENT" ? "/student/personality" : "/register?role=STUDENT";
  const hiredHref =
    userRole === "STUDENT" ? "/student/applications" : "/vacancies";

  const steps: JourneyStepItem[] = [
    {
      key: "discover",
      href: "/vacancies",
      title: t("step1Title"),
      desc: t("step1Desc"),
      icon: "search",
    },
    {
      key: "skills",
      href: skillsHref,
      title: t("step2Title"),
      desc: t("step2Desc"),
      icon: "layers",
    },
    {
      key: "profile",
      href: profileHref,
      title: t("step3Title"),
      desc: t("step3Desc"),
      icon: "chart",
    },
    {
      key: "hired",
      href: hiredHref,
      title: t("step4Title"),
      desc: t("step4Desc"),
      icon: "briefcase",
    },
  ];

  return (
    <section
      id="student-journey"
      aria-labelledby="student-journey-heading"
      className={styles.journeySection}
    >
      <div className={styles.sectionWrap}>
        <div className={styles.journeyBandGrid}>
          {/* Left column: Eyebrow, Heading, Subtitle, CTA */}
          <div className={styles.journeyCopyCol}>
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#058a5b] uppercase dark:text-[#34d399]">
              {t("eyebrow")}
            </p>
            <h2
              id="student-journey-heading"
              className="text-text mt-2 text-2xl leading-[1.08] font-extrabold tracking-tight sm:text-3xl lg:text-[2.15rem]"
            >
              {t("title")}
            </h2>
            <p className="text-subtle mt-3 max-w-xs text-sm leading-relaxed">
              {t("subtitle")}
            </p>
            <div className="mt-5">
              <Link
                href={startHref}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0b7b52] to-[#055237] px-5 py-2.5 text-xs font-bold text-white shadow-[0_12px_24px_-8px_rgba(5,82,55,0.48)] transition-all hover:-translate-y-0.5 hover:brightness-110 dark:from-[#10b981] dark:to-[#059669] dark:shadow-[0_14px_28px_-8px_rgba(16,185,129,0.52)]"
              >
                <span>{t("cta")}</span>
                <ArrowRightIcon size={15} />
              </Link>
            </div>
          </div>

          {/* Center-left foreground: Local student girl kept intact (day & defringed night cutout) */}
          <div className={styles.journeyGirlCol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/journey-student.png"
              alt={t("eyebrow")}
              width={360}
              height={360}
              className={`${styles.journeyGirlImg} ${styles.howDayAsset}`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/journey-student-dark.png"
              alt={t("eyebrow")}
              width={360}
              height={360}
              className={`${styles.journeyGirlImg} ${styles.journeyNightGirl}`}
            />
          </div>

          {/* Right column: Ascending glowing emerald rail + 4 looping frosted glass tiles */}
          <StudentJourneyTrack
            steps={steps}
            pauseLabel={t("pauseTrack")}
            resumeLabel={t("resumeTrack")}
          />
        </div>
      </div>
    </section>
  );
}
