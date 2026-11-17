import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { RegisterForm } from "@/frontend/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const t = await getTranslations("Auth.register");
  const { role } = await searchParams;
  const defaultRole = role === "COMPANY" ? "COMPANY" : "STUDENT";
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <RegisterForm defaultRole={defaultRole} />
    </AuthCard>
  );
}
