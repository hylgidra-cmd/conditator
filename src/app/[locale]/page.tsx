import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getLandingStats } from "@/backend/landing-stats";
import { DualCta } from "@/frontend/components/landing/dual-cta";
import { Hero } from "@/frontend/components/landing/hero";
import { Partners } from "@/frontend/components/landing/partners";
import { PlatformShowcase } from "@/frontend/components/landing/platform-showcase";
import { PromoShowcase } from "@/frontend/components/landing/promo-showcase";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/** Bosh sahifa (Candidator). Footer umumiy layoutda. */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const stats = await getLandingStats();

  return (
    <>
      <Hero stats={stats} />
      <Partners stats={stats} />
      <PromoShowcase stats={stats} />
      <ClientMessages namespaces={["Landing"]}>
        <PlatformShowcase stats={stats} />
      </ClientMessages>
      <DualCta />
    </>
  );
}
