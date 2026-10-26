import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

// Email kodi bilan tasdiqlash olib tashlangan: eski havolalar kirish sahifasiga yo'naltiriladi.
export default async function VerifyPage({ params }: Props) {
  const { locale } = await params;
  redirect({
    href: "/login",
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
  });
}
