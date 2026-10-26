import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardIndex({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  redirect({ href: "/dashboard/candidate", locale });
}
