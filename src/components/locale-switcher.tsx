"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Ixcham til menyusi: sarlavha bir qatorda qolishi uchun to'rt til ochiladigan ro'yxatda. */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const current = useLocale();
  // ?email=... kabi parametrlar til almashganda yo'qolmasligi uchun.
  const query = Object.fromEntries(useSearchParams());

  return (
    <details className="group relative">
      <summary
        aria-label={t("current", { locale: t(current) })}
        className="text-muted hover:text-foreground flex h-9 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm font-medium uppercase [&::-webkit-details-marker]:hidden"
      >
        {current}
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className="transition-transform group-open:rotate-180"
        >
          <path
            d="M3 4.5 6 7.5 9 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </summary>
      <nav
        aria-label={t("label")}
        className="border-border bg-surface absolute right-0 z-50 mt-2 flex min-w-40 flex-col rounded-lg border p-1"
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
              className={
                active
                  ? "text-brand rounded-lg px-3 py-2 text-sm font-semibold"
                  : "text-foreground hover:bg-surface-muted rounded-lg px-3 py-2 text-sm"
              }
            >
              {t(locale)}
            </Link>
          );
        })}
      </nav>
    </details>
  );
}
