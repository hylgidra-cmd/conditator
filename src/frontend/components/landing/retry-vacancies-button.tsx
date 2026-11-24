"use client";

import { useRouter } from "@/i18n/navigation";

export function RetryVacanciesButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      {label}
    </button>
  );
}
