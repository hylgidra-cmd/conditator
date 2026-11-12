import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { DashboardShell } from "@/frontend/components/dashboard/shell";
import { ClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { isRole } from "@/backend/dashboard/mock";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; role: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "Dashboard",
  });
  // Mock maʼlumotli demo: qidiruv tizimlariga koʻrsatilmaydi.
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function DashboardLayout({ children, params }: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale) || !isRole(role)) notFound();
  setRequestLocale(locale);
  return (
    <ClientMessages namespaces={["Dashboard"]}>
      <DashboardShell role={role} locale={locale}>
        {children}
      </DashboardShell>
    </ClientMessages>
  );
}
