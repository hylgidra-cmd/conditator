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
    <div className="mx-auto max-w-2xl px-4 py-8 text-center">
      <div className="mb-10 space-y-2">
        <h1 className="text-text text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("choiceTitle")}
        </h1>
        <p className="text-subtle text-base">{t("choiceDesc")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Choice 1: Import my CV (Recommended) */}
        <button
          type="button"
          onClick={() => onSelectChoice("import")}
          className="group border-line bg-card shadow-soft hover:border-primary focus:ring-primary/25 relative flex flex-col items-center justify-center rounded-2xl border p-8 text-center transition-colors focus:ring-4 focus:outline-none"
        >
          {/* Recommended Pill Badge */}
          <div className="bg-primary text-on-primary absolute -top-3.5 rounded-md px-3.5 py-1 text-xs font-bold">
            {t("importBadge")}
          </div>

          <div className="bg-primary-soft text-primary-text border-primary/30 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110">
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

          <h3 className="text-text group-hover:text-primary-text text-xl font-bold tracking-tight transition-colors">
            {t("importTitle")}
          </h3>
          <p className="text-subtle mt-2 text-sm leading-relaxed">
            {t("importDesc")}
          </p>
        </button>

        {/* Choice 2: From scratch */}
        <button
          type="button"
          onClick={() => onSelectChoice("scratch")}
          className="group border-line bg-card shadow-soft hover:border-primary focus:ring-primary/25 relative flex flex-col items-center justify-center rounded-2xl border p-8 text-center transition-colors focus:ring-4 focus:outline-none"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/15 text-teal-700 transition-transform group-hover:scale-110 dark:text-teal-300">
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

          <h3 className="text-text group-hover:text-primary-text text-xl font-bold tracking-tight transition-colors">
            {t("scratchTitle")}
          </h3>
          <p className="text-subtle mt-2 text-sm leading-relaxed">
            {t("scratchDesc")}
          </p>
        </button>
      </div>

      {/* Edit existing resume link if already created */}
      {hasExistingCv && onEditExisting && (
        <div className="border-line/70 mt-10 border-t pt-6">
          <button
            type="button"
            onClick={onEditExisting}
            className="text-primary-text text-sm font-bold hover:underline"
          >
            {t("editExisting")}
          </button>
        </div>
      )}
    </div>
  );
}
