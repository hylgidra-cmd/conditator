import "@fontsource-variable/noto-sans";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/inter";
import "../globals.css";

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/frontend/components/site-footer";
import {
  SiteChrome,
  SiteFooterChrome,
  SiteMain,
} from "@/frontend/components/site-chrome";
import { SiteHeader } from "@/frontend/components/site-header";
import { ClientMessages } from "@/i18n/client-messages";
import {
  CANONICAL_SITE_URL,
  OG_LOCALE,
  SEO_KEYWORDS,
  buildAlternates,
} from "@/backend/seo";
import { THEME_COOKIE, THEME_INIT_SCRIPT, parseTheme } from "@/backend/theme";
import { type Locale, routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#050e0b" },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: validLocale,
    namespace: "Metadata",
  });
  const title = t("title");
  const description = t("description");
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const yandexVerification = process.env.YANDEX_VERIFICATION?.trim();

  return {
    metadataBase: new URL(CANONICAL_SITE_URL),
    applicationName: "Candidator",
    title: {
      default: title,
      template: "%s — Candidator",
    },
    description,
    keywords: SEO_KEYWORDS[validLocale],
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/logo-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/favicon.ico"],
    },
    alternates: buildAlternates(validLocale, ""),
    openGraph: {
      type: "website",
      siteName: "Candidator",
      locale: OG_LOCALE[validLocale],
      url: `${CANONICAL_SITE_URL}/${validLocale}`,
      title,
      description,
      images: [
        {
          url: `${CANONICAL_SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Candidator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${CANONICAL_SITE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    ...(googleVerification || yandexVerification
      ? {
          verification: {
            ...(googleVerification ? { google: googleVerification } : {}),
            ...(yandexVerification ? { yandex: yandexVerification } : {}),
          },
        }
      : {}),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Standart rejim Neo-Editorial Emerald ("light"); foydalanuvchi oʻzgartirsa cookie/localStorage ishlaydi.
  const theme =
    parseTheme((await cookies()).get(THEME_COOKIE)?.value) ?? "light";

  return (
    // suppressHydrationWarning: <head> dagi skript data-theme ni React dan oldin oʻzgartirishi mumkin.
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        {/* Saqlangan rejim birinchi chizishdan oldin qoʻyiladi: miltillash yoʻq. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-clip font-sans antialiased">
        <ClientMessages namespaces={[]}>
          <SiteChrome>
            <SiteHeader />
          </SiteChrome>
          <SiteMain>{children}</SiteMain>
          <SiteFooterChrome>
            <SiteFooter />
          </SiteFooterChrome>
        </ClientMessages>
      </body>
    </html>
  );
}
