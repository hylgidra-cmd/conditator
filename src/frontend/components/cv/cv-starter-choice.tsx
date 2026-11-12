"use client";

import { useTranslations } from "next-intl";

type Props = {
  hasExistingCv: boolean;
  onSelectChoice: (choice: "import" | "scratch") => void;
  onEditExisting?: () => void;
};

export function CvStarterChoice({
  hasExistingCv,
  onSelectChoice,
  onEditExisting,
}: Props) {
  const t = useTranslations("StudentCv.onboarding");

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 text-center">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("choiceTitle")}
        </h1>
        <p className="text-muted text-base">
          {t("choiceDesc")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Choice 1: Import my CV (Recommended) */}
        <button
          type="button"
          onClick={() => onSelectChoice("import")}
          className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-brand/40 bg-surface p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand/20"
        >
          {/* Recommended Pill Badge */}
          <div className="absolute -top-3.5 rounded-full bg-brand px-3.5 py-1 text-xs font-bold text-brand-foreground shadow">
            {t("importBadge")}
          </div>

          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform group-hover:scale-110">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold tracking-tight group-hover:text-brand transition-colors">
            {t("importTitle")}
          </h3>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            {t("importDesc")}
          </p>
        </button>

        {/* Choice 2: From scratch */}
        <button
          type="button"
          onClick={() => onSelectChoice("scratch")}
          className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-border bg-surface p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand/20"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-bold tracking-tight group-hover:text-brand transition-colors">
            {t("scratchTitle")}
          </h3>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            {t("scratchDesc")}
          </p>
        </button>
      </div>

      {/* Edit existing resume link if already created */}
      {hasExistingCv && onEditExisting && (
        <div className="mt-10 pt-6 border-t border-border/60">
          <button
            type="button"
            onClick={onEditExisting}
            className="text-brand text-sm font-semibold hover:underline"
          >
            {t("editExisting")}
          </button>
        </div>
      )}
    </div>
  );
}
