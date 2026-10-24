import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";

// Kirgan foydalanuvchi auth sahifalarini ko'rmaydi: kabinetga yo'naltiriladi.
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await currentUser())
    redirect({ href: "/account", locale: await getLocale() });
  return children;
}
