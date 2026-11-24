"use client";

import { useState } from "react";

type Props = {
  companyId: string;
  companyName?: string | null;
  hasLogo: boolean;
  sizeClass?: string;
};

/** Renders real uploaded company logo with graceful initial monogram fallback. */
export function CompanyLogo({
  companyId,
  companyName,
  hasLogo,
  sizeClass = "size-10",
}: Props) {
  const [broken, setBroken] = useState(false);
  const initial = (companyName?.trim().charAt(0) || "C").toUpperCase();

  if (!hasLogo || broken) {
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 font-extrabold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300 ${sizeClass}`}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/companies/${companyId}/logo`}
      alt={companyName || ""}
      onError={() => setBroken(true)}
      className={`shrink-0 rounded-xl border border-slate-200/80 bg-white object-contain p-1 dark:border-white/10 ${sizeClass}`}
    />
  );
}
