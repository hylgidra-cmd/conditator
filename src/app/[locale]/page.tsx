import { notFound } from "next/navigation";
import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const FEATURE_GROUPS = ["students", "companies"] as const;
const FEATURE_ITEMS = ["item1", "item2", "item3"] as const;
const STEPS = ["step1", "step2", "step3"] as const;

export default function HomePage({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <section className="text-center">
        <span className="bg-brand-soft text-brand inline-block rounded-full px-3 py-1 text-xs font-semibold">
          {t("badge")}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-2xl text-base sm:text-lg">
          {t("subtitle")}
        </p>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        {FEATURE_GROUPS.map((group) => (
          <div
            key={group}
            className="border-border bg-surface rounded-2xl border p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{t(`${group}.title`)}</h2>
            <ul className="text-muted mt-4 space-y-2">
              {FEATURE_ITEMS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  {t(`${group}.${item}`)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-center text-xl font-semibold">{t("how.title")}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
            >
              <span className="bg-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                {index + 1}
              </span>
              {t(`how.${step}`)}
            </li>
          ))}
        </ol>
        <p className="text-muted mt-8 text-center text-sm">{t("trust")}</p>
      </section>
    </div>
  );
}
