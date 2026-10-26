import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

type Props = {
  searchParams: Promise<{
    reset?: string;
    registered?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { reset, registered, email } = await searchParams;
  const t = await getTranslations("Auth.login");
  return (
    <AuthCard title={t("title")}>
      <LoginForm
        resetDone={reset === "1"}
        registered={registered === "1"}
        email={email}
      />
    </AuthCard>
  );
}
