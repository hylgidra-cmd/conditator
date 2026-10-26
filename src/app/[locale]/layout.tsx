import "@fontsource-variable/noto-sans";
import "@fontsource-variable/source-serif-4";
import "../globals.css";

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Metadata",
  });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Qo'lda tanlangan rejim serverda qo'yiladi (miltillashsiz); bo'lmasa tizim sozlamasi ishlaydi.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} data-theme={theme}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ClientMessages namespaces={[]}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ClientMessages>
      </body>
    </html>
  );
}
