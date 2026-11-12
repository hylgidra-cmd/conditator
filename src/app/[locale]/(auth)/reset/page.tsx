import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { ResetForm } from "@/frontend/components/auth/reset-form";
import { emailSchema } from "@/backend/auth/schemas";

type Props = { searchParams: Promise<{ email?: string }> };

export default async function ResetPage({ searchParams }: Props) {
  const parsed = emailSchema.safeParse((await searchParams).email ?? "");
  const t = await getTranslations("Auth.reset");
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <ResetForm email={parsed.success ? parsed.data : ""} />
    </AuthCard>
  );
}
