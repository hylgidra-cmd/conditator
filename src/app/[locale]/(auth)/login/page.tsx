import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

type Props = { searchParams: Promise<{ reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { reset } = await searchParams;
  const t = await getTranslations("Auth.login");
  return (
    <AuthCard title={t("title")}>
      <LoginForm resetDone={reset === "1"} />
    </AuthCard>
  );
}
