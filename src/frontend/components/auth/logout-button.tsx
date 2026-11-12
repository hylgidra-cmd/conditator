"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { postJson } from "@/backend/client/api";

export function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const router = useRouter();

  async function onClick() {
    await postJson("/api/auth/logout");
    router.replace("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {t("logout")}
    </button>
  );
}
