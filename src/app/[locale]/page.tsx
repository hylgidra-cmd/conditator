import { notFound } from "next/navigation";
import { hasLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { HowItWorks } from "@/components/home/how-it-works";
import { Categories } from "@/components/landing/categories";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Partners } from "@/components/landing/partners";
import { Profile } from "@/components/landing/profile";
import { PricingSelector } from "@/components/home/pricing-selector";
import { TelegramIcon } from "@/components/home/telegram-icon";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatUsd, PRICING_TIERS, TELEGRAM_URL } from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

const PROBLEMS = ["resumes", "slow", "noHr"] as const;
const BENEFITS = [
  "time",
  "noHr",
  "clear",
  "language",
  "privacy",
  "verified",
] as const;
const AUDIENCES = ["seekers", "centers", "universities"] as const;
const FAQ = ["1", "2", "3", "4", "5", "6", "7"] as const;

const CONTAINER = "mx-auto max-w-6xl px-4 sm:px-6";
const H2 =
  "font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl";
const PRIMARY =
  "bg-brand text-brand-foreground hover:bg-brand-strong inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold transition-colors";
const SECONDARY =
  "border-border hover:border-foreground inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 font-semibold transition-colors";

export default function HomePage({ params }: Props) {
  const { locale } = use(params);
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <>
      <Hero />
      <Partners />
      <Features />
      <Categories />
      <Profile />

      {/* Muammo */}
      <section className="border-border border-t">
        <div
          className={`${CONTAINER} grid gap-10 py-16 sm:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16`}
        >
          <h2 className={`${H2} reveal max-w-md`}>{t("problem.title")}</h2>
          <dl className="divide-border divide-y">
            {PROBLEMS.map((key) => (
              <div
                key={key}
                className="reveal grid gap-2 py-6 first:pt-0 last:pb-0 sm:grid-cols-[14rem_1fr] sm:gap-8"
              >
                <dt className="text-lg font-semibold">
                  {t(`problem.${key}.title`)}
                </dt>
                <dd className="text-muted leading-relaxed">
                  {t(`problem.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section id="how" className="border-border border-t">
        <div className={`${CONTAINER} py-16 sm:py-24`}>
          <div className="max-w-xl">
            <h2 className={H2}>{t("how.title")}</h2>
            <p className="text-muted mt-4 text-lg">{t("how.lead")}</p>
          </div>
          <HowItWorks
            steps={[
              {
                title: t("how.step1.title"),
                body: t("how.step1.body"),
                imageAlt: t("how.step1.imageAlt"),
                screen: "vacancy",
              },
              {
                title: t("how.step2.title"),
                body: t("how.step2.body"),
                imageAlt: t("how.step2.imageAlt"),
                screen: "matches",
              },
              {
                title: t("how.step3.title"),
                body: t("how.step3.body"),
                imageAlt: t("how.step3.imageAlt"),
                screen: "candidate",
              },
            ]}
          />
        </div>
      </section>

      {/* Ish beruvchiga foydasi */}
      <section className="border-border border-t">
        <div className={`${CONTAINER} py-16 sm:py-24`}>
          <h2 className={`${H2} reveal max-w-xl`}>{t("benefits.title")}</h2>
          <div className="mt-12 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((key) => (
              <div key={key} className="border-border reveal border-t py-6">
                <h3 className="font-semibold">{t(`benefits.${key}.title`)}</h3>
                <p className="text-muted mt-2 leading-relaxed">
                  {t(`benefits.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ish izlovchilar va hamkorlar */}
      <section className="bg-surface-muted">
        <div className={`${CONTAINER} py-16 sm:py-20`}>
          <h2 className="font-display max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("audiences.title")}
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
            {AUDIENCES.map((key) => (
              <div key={key}>
                <h3 className="font-semibold">{t(`audiences.${key}.title`)}</h3>
                <p className="text-muted mt-2 leading-relaxed">
                  {t(`audiences.${key}.body`)}
                </p>
                {key === "seekers" ? (
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                    <Link
                      href="/register"
                      className="text-brand hover:text-brand-strong underline underline-offset-4"
                    >
                      {t("audiences.seekers.cta")}
                    </Link>
                    <a
                      href={TELEGRAM_URL}
                      rel="noopener"
                      className="text-brand hover:text-brand-strong underline underline-offset-4"
                    >
                      {t("audiences.seekers.telegram")}
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <p className="text-muted border-border mt-12 border-t pt-6 text-sm">
            {t("audiences.partners")}
          </p>
        </div>
      </section>

      {/* Narxlar */}
      <section id="pricing" className="border-border border-t">
        <div
          className={`${CONTAINER} grid gap-10 py-16 sm:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16`}
        >
          <div>
            <h2 className={H2}>{t("pricing.title")}</h2>
            <p className="text-muted mt-4 text-lg">{t("pricing.lead")}</p>
            <p className="text-muted mt-2 text-sm">{t("pricing.note")}</p>
          </div>
          <div>
            <PricingSelector
              tiers={PRICING_TIERS}
              labels={{
                sizeLabel: t("pricing.sizeLabel"),
                period: t("pricing.period"),
                includesTitle: t("pricing.includesTitle"),
                includes: [
                  t("pricing.include1"),
                  t("pricing.include2"),
                  t("pricing.include3"),
                ],
                cta: t("pricing.cta"),
                small: t("pricing.small"),
                staff: PRICING_TIERS.map((tier) =>
                  t("pricing.staff", { range: tier.range }),
                ),
              }}
            />
            <details className="group mt-4">
              <summary className="text-muted hover:text-foreground cursor-pointer text-sm font-medium">
                {t("pricing.tableCaption")}
              </summary>
              <table className="mt-3 w-full text-left text-sm">
                <caption className="sr-only">
                  {t("pricing.tableCaption")}
                </caption>
                <thead className="text-muted">
                  <tr className="border-border border-b">
                    <th scope="col" className="py-2 font-medium">
                      {t("pricing.tableSize")}
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      {t("pricing.tablePrice")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y tabular-nums">
                  {PRICING_TIERS.map((tier) => (
                    <tr key={tier.range}>
                      <td className="py-2">{tier.range}</td>
                      <td className="py-2 text-right">
                        {formatUsd(tier.price)}{" "}
                        <span className="text-muted">
                          {t("pricing.period")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </div>
      </section>

      {/* Savollar */}
      <section id="faq" className="border-border border-t">
        <div
          className={`${CONTAINER} grid gap-10 py-16 sm:py-24 lg:grid-cols-[5fr_7fr] lg:gap-16`}
        >
          <h2 className={`${H2} max-w-md`}>{t("faq.title")}</h2>
          <div className="divide-border border-border divide-y border-y">
            {FAQ.map((n) => (
              <details key={n} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                  {t(`faq.q${n}`)}
                  <svg
                    aria-hidden
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    className="text-muted mt-1 shrink-0 transition-transform group-open:rotate-45"
                  >
                    <path
                      d="M8 2v12M2 8h12"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </summary>
                <p className="text-muted max-w-prose pb-5 leading-relaxed">
                  {t(`faq.a${n}`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Yakuniy chaqiriq */}
      <section className="border-border border-t">
        <div className={`${CONTAINER} py-20 sm:py-28`}>
          <h2 className="font-display reveal max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            {t("final.title")}
          </h2>
          <p className="text-muted mt-5 max-w-md text-lg">{t("final.body")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={PRIMARY}>
              {t("final.cta")}
            </Link>
            <a href={TELEGRAM_URL} rel="noopener" className={SECONDARY}>
              <TelegramIcon />
              {t("final.telegram")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
