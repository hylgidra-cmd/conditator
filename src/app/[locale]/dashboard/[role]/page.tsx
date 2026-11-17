import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string; role: string }>;
};

export default async function DashboardRoleRedirect({ params }: Props) {
  const { locale, role } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  if (role === "candidate") {
    return redirect({ href: "/student/cv", locale });
  }
  if (role === "employer") {
    return redirect({ href: "/company", locale });
  }

  return redirect({ href: "/dashboard", locale });
}
