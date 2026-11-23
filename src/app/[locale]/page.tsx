import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getLandingStats } from "@/backend/landing-stats";
import { CANONICAL_SITE_URL, safeJsonLd } from "@/backend/seo";
import { EMAIL, TELEGRAM_URL } from "@/backend/site";
import { HomeExperience } from "@/frontend/components/landing/home-experience";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/** Bosh sahifa (Candidator). Footer umumiy layoutda. */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const stats = await getLandingStats();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${CANONICAL_SITE_URL}/#organization`,
        name: "Candidator",
        url: CANONICAL_SITE_URL,
        logo: `${CANONICAL_SITE_URL}/logo-512.png`,
        email: EMAIL,
        sameAs: [TELEGRAM_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_SITE_URL}/#website`,
        name: "Candidator",
        alternateName: ["Candidator UZ", "Candidator Vakansiyalar"],
        url: CANONICAL_SITE_URL,
        inLanguage: ["uz", "kk", "ru", "en"],
        publisher: { "@id": `${CANONICAL_SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${CANONICAL_SITE_URL}/${locale}/vacancies?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <HomeExperience stats={stats} />
    </>
  );
}
