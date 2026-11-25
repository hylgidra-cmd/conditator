import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";
import {
  AuthBackgroundRibbons,
  AuthGlobeStage,
} from "@/frontend/components/auth/auth-globe-stage";
import styles from "@/frontend/components/auth/auth-globe.module.css";
import { Link } from "@/i18n/navigation";

export async function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const tFooter = await getTranslations("Auth.footer");

  return (
    <section
      className={`${styles.authShell} font-ui flex items-center py-6 sm:py-8 lg:py-10`}
    >
      <AuthBackgroundRibbons />

      <div className="relative z-10 mx-auto w-full max-w-[1660px] px-4 sm:px-8 lg:px-12">
        <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left column: dominant glass Registan globe shifted 15px left & enlarged */}
          <div className="flex items-center justify-center lg:col-span-7 lg:-mt-2">
            <AuthGlobeStage />
          </div>

          {/* Right column: wide, tall frosted auth panel */}
          <div className="mx-auto w-full max-w-md lg:col-span-5 lg:ml-auto lg:mr-0 lg:max-w-[645px]">
            <Reveal>
              <div
                className={`${styles.authCardSurface} flex flex-col justify-between p-7 sm:p-10 lg:min-h-[675px] lg:px-12 lg:py-11`}
              >
                <div className={styles.cardTopGleam} aria-hidden="true" />
                <div className="relative z-10">
                  <h1 className="text-text text-[2.15rem] leading-[1.08] font-extrabold tracking-[-0.03em] sm:text-[2.6rem] lg:text-[2.95rem]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="text-subtle mt-2.5 text-sm sm:text-base lg:text-[1.125rem]">
                      {subtitle}
                    </p>
                  ) : null}
                  <div className="mt-7 lg:mt-8">{children}</div>
                </div>

                {/* Bottom destination links matching Image 2 (clean vertical divider, single-line descriptions) */}
                <div className="relative z-10 mt-9 grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-slate-900/10 lg:mt-10 dark:sm:divide-emerald-400/18">
                  <Link
                    href="/register?role=STUDENT"
                    className="group flex items-center gap-3.5 rounded-xl py-1.5 pr-4 transition-opacity hover:opacity-90"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f6ef] text-[#058b57] dark:bg-emerald-400/15 dark:text-emerald-300">
                      <svg
                        width="21"
                        height="21"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-text whitespace-nowrap text-sm font-bold lg:text-[15px]">
                        {tFooter("studentTitle")}
                      </p>
                      <p className="text-subtle mt-0.5 text-xs leading-snug lg:text-[13px]">
                        {tFooter("studentDesc")}
                      </p>
                    </div>
                    <span
                      className="text-subtle shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </Link>

                  <Link
                    href="/register?role=COMPANY"
                    className="group flex items-center gap-3.5 rounded-xl py-1.5 transition-opacity hover:opacity-90 sm:pl-6"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f6ef] text-[#058b57] dark:bg-emerald-400/15 dark:text-emerald-300">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
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
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-text whitespace-nowrap text-sm font-bold lg:text-[15px]">
                        {tFooter("employerTitle")}
                      </p>
                      <p className="text-subtle mt-0.5 text-xs leading-snug lg:text-[13px]">
                        {tFooter("employerDesc")}
                      </p>
                    </div>
                    <span
                      className="text-subtle shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
