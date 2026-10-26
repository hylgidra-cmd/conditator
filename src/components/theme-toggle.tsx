"use client";

import { useEffect } from "react";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  parseTheme,
  type Theme,
} from "@/lib/theme";

/** `className` berilsa standart koʻrinish oʻrniga ishlatiladi. */
type Props = { toDark: string; toLight: string; className?: string };

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Yorugʻ/tungi rejimni almashtiradi; tanlov localStorage va cookie da saqlanadi (`applyTheme`). */
export function ThemeToggle({ toDark, toLight, className }: Props) {
  // Boshqa oynada rejim almashsa, shu oyna ham ergashadi.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const theme =
        e.key === THEME_STORAGE_KEY ? parseTheme(e.newValue) : undefined;
      if (theme) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function onClick() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "text-muted hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-lg"
      }
    >
      {/* Belgi va yozuv rejimga qarab CSS orqali almashadi (server va brauzer bir xil chiziladi). */}
      <span className="theme-light-only">
        <span className="sr-only">{toDark}</span>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
      <span className="theme-dark-only">
        <span className="sr-only">{toLight}</span>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
    </button>
  );
}
