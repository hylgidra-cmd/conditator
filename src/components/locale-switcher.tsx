"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const pathname = usePathname();
  const current = useLocale();

  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-1 text-sm">
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "bg-brand rounded-md px-2 py-1 font-semibold text-white"
                : "text-muted hover:bg-brand-soft rounded-md px-2 py-1"
            }
          >
            {t(locale)}
          </Link>
        );
      })}
    </nav>
  );
}
