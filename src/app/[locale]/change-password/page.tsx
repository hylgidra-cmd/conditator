import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { ChangePasswordForm } from "@/frontend/components/auth/change-password-form";
import { ClientMessages } from "@/i18n/client-messages";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.changePassword");
  return { title: t("title") };
}

export default async function ChangePasswordPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/forgot", locale });

  const t = await getTranslations("Auth.changePassword");
  return (
    <ClientMessages namespaces={["Auth"]}>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        <ChangePasswordForm />
      </AuthCard>
    </ClientMessages>
  );
}
