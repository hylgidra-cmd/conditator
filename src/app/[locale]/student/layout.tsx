import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ClientMessages } from "@/i18n/client-messages";
import { currentUser } from "@/lib/auth/current-user";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) {
    return redirect({ href: "/login", locale });
  }
  if (user.role !== "STUDENT" && user.role !== "ADMIN") {
    return redirect({ href: "/account", locale });
  }

  return <ClientMessages namespaces={["StudentCv"]}>{children}</ClientMessages>;
}
