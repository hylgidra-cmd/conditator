"use client";

import type { UserStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useErrorText } from "@/frontend/components/ui/form";
import { requestJson } from "@/backend/client/api";

export function UserStatusButton({
  userId,
  status,
  email,
}: {
  userId: string;
  status: UserStatus;
  email: string;
}) {
  const t = useTranslations("Admin.users");
  const errorText = useErrorText();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const next: UserStatus = status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  async function toggle() {
    if (next === "BLOCKED" && !window.confirm(t("confirmBlock", { email })))
      return;
    setBusy(true);
    setError(undefined);
    const result = await requestJson(
      "PATCH",
      `/api/admin/users/${userId}/status`,
      { status: next },
    );
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg border px-3 py-1 text-sm font-semibold disabled:opacity-60 ${
          next === "BLOCKED"
            ? "border-red-300 text-red-700"
            : "border-green-300 text-green-700"
        }`}
      >
        {next === "BLOCKED" ? t("block") : t("unblock")}
      </button>
      {error ? (
        <p className="text-xs text-red-600">{errorText(error)}</p>
      ) : null}
    </div>
  );
}
