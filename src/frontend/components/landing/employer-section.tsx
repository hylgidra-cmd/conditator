import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";
import { EmployerVisual } from "./employer-visual";
import styles from "./sections.module.css";

/**
 * Section 4 — People-Free Employer Band.
 * Blends full-width atmospheric emerald mesh seamlessly into the surrounding layout
 * with role-aware CTA and animated tower-to-folder visual scene.
 */
export async function EmployerSection({ userRole }: { userRole?: Role }) {
  const t = await getTranslations("Landing.employerSection");

  const ctaHref =
    userRole === "COMPANY"
      ? "/company/vacancies/new"
      : userRole === "ADMIN"
        ? "/admin"
        : "/register?role=COMPANY";

  return (
    <section
      id="employer-section"
      aria-labelledby="employer-section-heading"
      className={styles.employerBand}
    >
      {/* Full-bleed subtle horizontal light rays across viewport width */}
      <svg
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
      >
        <defs>
          <linearGradient id="empBandSweep" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="30%" stopColor="#34d399" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#6ee7b7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -60 280 C 280 220, 620 315, 980 250 C 1220 205, 1360 230, 1500 185"
          fill="none"
          stroke="url(#empBandSweep)"
          strokeWidth="3"
        />
        <path
          d="M -40 110 C 310 155, 680 65, 1040 130 C 1240 165, 1380 115, 1500 135"
          fill="none"
          stroke="url(#empBandSweep)"
          strokeWidth="1.5"
        />
      </svg>

      <div className={`${styles.sectionWrap} relative z-20`}>
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(320px,0.52fr)_minmax(0,1.48fr)] lg:gap-0">
          <div className="relative z-30 max-w-lg py-2 pr-2">
            <h2
              id="employer-section-heading"
              className="text-4xl leading-[1.04] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem]"
            >
              {t("title")}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/88 sm:text-lg lg:text-[1.1rem]">
              {t("subtitle")}
            </p>
            <div className="mt-7">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#042c1e] shadow-[0_14px_30px_-8px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:bg-[#ecfdf5]"
              >
                <span>{t("cta")}</span>
                <ArrowRightIcon size={18} />
              </Link>
            </div>
          </div>

          <EmployerVisual
            towerAlt={t("towerAlt")}
            docLabel={t("vacancyCardLabel")}
            folderLabel={t("folderLabel")}
          />
        </div>
      </div>
    </section>
  );
}
