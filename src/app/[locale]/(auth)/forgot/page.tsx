import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";

export default async function ForgotPage() {
  const t = await getTranslations("Auth.forgot");
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <ForgotForm />
    </AuthCard>
  );
}
