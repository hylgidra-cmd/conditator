import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { RegisterForm } from "@/frontend/components/auth/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("Auth.register");
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <RegisterForm />
    </AuthCard>
  );
}
