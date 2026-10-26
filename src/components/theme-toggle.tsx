"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
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
        <MoonIcon size={18} />
      </span>
      <span className="theme-dark-only">
        <span className="sr-only">{toLight}</span>
        <SunIcon size={18} />
      </span>
    </button>
  );
}
