import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ClientMessages } from "@/i18n/client-messages";
import { currentUser } from "@/backend/auth/current-user";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) {
    return redirect({ href: "/login", locale });
  }
  if (user.role !== "COMPANY" && user.role !== "ADMIN") {
    return redirect({ href: "/account", locale });
  }

  return (
    <ClientMessages
      namespaces={["Company", "Vacancies", "Matches", "Candidate", "StudentCv"]}
    >
      {children}
    </ClientMessages>
  );
}
