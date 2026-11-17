"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn, FOCUS_RING } from "./ds/cn";

/** Ixcham til menyusi: klik tashqarisida va Esc bosilganda animatsiya bilan yopiladi. */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const current = useLocale();
  const query = Object.fromEntries(useSearchParams());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("current", { locale: t(current) })}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "border-line/70 bg-card/60 text-subtle hover:border-primary/40 hover:text-text flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold uppercase transition-all",
          FOCUS_RING,
        )}
      >
        {current}
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={cn("transition-transform duration-200", open && "rotate-180")}
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {open && (
        <nav
          aria-label={t("label")}
          className="ds-modal-panel border-line bg-card/95 shadow-float absolute right-0 z-50 mt-2 flex min-w-44 flex-col gap-0.5 rounded-2xl border p-1.5 backdrop-blur-xl"
        >
          {routing.locales.map((locale) => {
            const active = locale === current;
            return (
              <Link
                key={locale}
                href={{ pathname, query }}
                locale={locale}
                lang={locale}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary-soft text-primary-text font-bold"
                    : "text-text hover:bg-card-cool font-medium",
                )}
              >
                {t(locale)}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
