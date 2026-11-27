"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AiLimitForm } from "./ai-limit-form";

export function AiLimitModalButton({ initial }: { initial: number }) {
  const t = useTranslations("AdminStudio");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 h-10 w-full cursor-pointer rounded-xl border border-[#0e935f]/40 bg-transparent text-xs font-extrabold text-[#097349] transition hover:bg-[#e5f7ee] dark:border-[#34eab0]/45 dark:text-[#3be7a3] dark:hover:bg-[#0e3b29]"
      >
        {t("changeLimitBtn")}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#cde6da] bg-white p-6 shadow-2xl dark:border-[#247353] dark:bg-[#071f16]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-[#0c2219] dark:text-[#f2fbf6]">
                {t("changeLimitModalTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="cursor-pointer rounded-lg px-2 py-1 text-sm font-bold text-[#5b7a6d] hover:bg-[#edf7f2] dark:text-[#98c1b0] dark:hover:bg-[#0d3123]"
              >
                ✕
              </button>
            </div>
            <AiLimitForm initial={initial} />
          </div>
        </div>
      ) : null}
    </>
  );
}
