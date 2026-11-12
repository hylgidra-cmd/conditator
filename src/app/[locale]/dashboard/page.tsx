import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { currentUser } from "@/lib/auth/current-user";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardIndex({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const user = await currentUser();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  if (user.role === "STUDENT") {
    return redirect({ href: "/student/cv", locale });
  }
  if (user.role === "COMPANY") {
    return redirect({ href: "/company", locale });
  }
  if (user.role === "ADMIN") {
    return redirect({ href: "/admin", locale });
  }

  return redirect({ href: "/login", locale });
}
