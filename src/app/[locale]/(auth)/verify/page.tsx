import { getLocale, getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyForm } from "@/components/auth/verify-form";
import { redirect } from "@/i18n/navigation";
import { CODE_TTL_MS } from "@/lib/auth/email-code";
import { emailSchema } from "@/lib/auth/schemas";

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const parsed = emailSchema.safeParse((await searchParams).email ?? "");
  if (!parsed.success)
    redirect({ href: "/register", locale: await getLocale() });
  const email = parsed.data!;
  const t = await getTranslations("Auth.verify");
  return (
    <AuthCard
      title={t("title")}
      subtitle={t("subtitle", { email, minutes: CODE_TTL_MS / 60_000 })}
    >
      <VerifyForm email={email} />
    </AuthCard>
  );
}
