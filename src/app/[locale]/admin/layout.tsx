import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { AdminStudioShell } from "@/frontend/components/admin/admin-studio-shell";
import { ClientMessages } from "@/i18n/client-messages";
import { redirect } from "@/i18n/navigation";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) {
    return redirect({ href: "/login", locale });
  }
  if (user.role !== "ADMIN") {
    return redirect({ href: "/account", locale });
  }

  return (
    <ClientMessages namespaces={["Admin", "AdminStudio"]}>
      <AdminStudioShell adminEmail={user.email}>{children}</AdminStudioShell>
    </ClientMessages>
  );
}
