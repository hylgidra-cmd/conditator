import type { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "@/frontend/components/icons";
import { cn, FOCUS_RING } from "@/frontend/components/ds/cn";
import { Link } from "@/i18n/navigation";
import { CtaOrbit } from "./cta-orbit";
import styles from "./sections.module.css";

/**
 * Section 6 — Final Call To Action.
 * Rich jade-emerald architectural banner with diagonal studio light shafts,
 * bold balanced typography, role-aware CTAs, and the 3D crystal 'C' orbital sculpture.
 */
export async function FinalCta({ userRole }: { userRole?: Role }) {
  const t = await getTranslations("Landing.finalCta");

  const studentHref =
    userRole === "STUDENT"
      ? "/student/cv"
      : userRole === "ADMIN"
        ? "/admin"
        : "/register?role=STUDENT";
  const employerHref =
    userRole === "COMPANY"
      ? "/company"
      : userRole === "ADMIN"
        ? "/admin"
        : "/register?role=COMPANY";

  return (
    <section
      id="join-ecosystem"
      aria-labelledby="final-cta-heading"
      className="py-6 pb-16 sm:pb-20"
    >
      <div className={styles.sectionWrap}>
        <div className={`${styles.finalCtaCard} px-7 py-8 sm:px-14 sm:py-9 lg:px-16 lg:py-6`}>
          {/* Diagonal Studio Glass Light Planes & Emerald Caustic Blooms (matching template) */}
          <svg
            viewBox="0 0 1440 360"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          >
            <defs>
              <linearGradient id="ctaShaftCenter" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.04" />
                <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
              </linearGradient>
              <linearGradient id="ctaShaftRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.28" />
                <stop offset="65%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#022c1e" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="ctaBottomGlow" cx="55%" cy="96%" r="36%">
                <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.52" />
                <stop offset="45%" stopColor="#10b981" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#043f2b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="ctaTopRightGlow" cx="92%" cy="8%" r="30%">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.48" />
                <stop offset="55%" stopColor="#10b981" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#043f2b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Diagonal architectural glass light planes */}
            <polygon
              points="640,0 890,0 695,360 465,360"
              fill="url(#ctaShaftCenter)"
            />
            <polygon
              points="1190,0 1440,0 1440,295 1030,360"
              fill="url(#ctaShaftRight)"
            />
            <rect x="0" y="0" width="1440" height="360" fill="url(#ctaBottomGlow)" />
            <rect x="0" y="0" width="1440" height="360" fill="url(#ctaTopRightGlow)" />
          </svg>

          <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:gap-4">
            <div className="py-2 lg:py-5">
              <h2
                id="final-cta-heading"
                className="max-w-xl text-3xl leading-[1.06] font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.95rem] xl:text-[3.25rem]"
              >
                {t("title")}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/88 sm:text-lg">
                {t("subtitle")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <Link
                  href={studentHref}
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-extrabold text-[#052e20] shadow-[0_14px_28px_-8px_rgba(0,0,0,0.38)] transition-all hover:-translate-y-0.5 hover:bg-[#ecfdf5] sm:px-8 sm:py-4 sm:text-base",
                    FOCUS_RING,
                  )}
                >
                  <span>{t("studentBtn")}</span>
                  <ArrowRightIcon size={17} />
                </Link>

                <Link
                  href={employerHref}
                  className={cn(
                    "inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-white/55 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white shadow-[inset_0_1px_8px_rgba(255,255,255,0.18)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/18 sm:px-8 sm:py-4 sm:text-base",
                    FOCUS_RING,
                  )}
                >
                  <span>{t("employerBtn")}</span>
                  <ArrowRightIcon size={17} />
                </Link>
              </div>
            </div>

            <CtaOrbit />
          </div>
        </div>
      </div>
    </section>
  );
}
