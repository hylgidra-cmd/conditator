"use client";

import { useState } from "react";
import { requestJson } from "@/backend/client/api";
import { useRouter } from "@/i18n/navigation";

type Props = {
  vacancyId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  loginNext?: string;
  saveLabel: string;
  savedLabel: string;
  className?: string;
};

/** Persistent vacancy bookmark button backed by /api/vacancies/[id]/bookmark. */
export function BookmarkButton({
  vacancyId,
  initialSaved,
  isAuthenticated,
  loginNext,
  saveLabel,
  savedLabel,
  className = "",
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function onToggle() {
    if (pending) return;
    if (!isAuthenticated) {
      const targetNext = loginNext || `/vacancies/${vacancyId}`;
      router.push(`/login?next=${encodeURIComponent(targetNext)}`);
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setPending(true);

    const res = await requestJson<{ ok: boolean; saved: boolean }>(
      nextSaved ? "POST" : "DELETE",
      `/api/vacancies/${vacancyId}/bookmark`,
    );

    setPending(false);
    if (res.ok) {
      setSaved(res.data.saved);
      router.refresh();
    } else {
      setSaved(!nextSaved);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={isAuthenticated ? saved : undefined}
      aria-label={saved ? savedLabel : saveLabel}
      title={saved ? savedLabel : saveLabel}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 ${
        saved
          ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300"
          : "border-slate-200/80 bg-white/80 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-emerald-300"
      } ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
