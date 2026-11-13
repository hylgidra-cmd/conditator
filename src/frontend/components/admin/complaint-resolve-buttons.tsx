"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { requestJson } from "@/backend/client/api";

export function ComplaintResolveButtons({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const t = useTranslations("Admin.complaints");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (status !== "PENDING") return null;

  async function update(nextStatus: "RESOLVED" | "DISMISSED") {
    setPending(true);
    const res = await requestJson("PATCH", `/api/admin/complaints/${id}`, {
      status: nextStatus,
    });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void update("RESOLVED")}
        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        {t("resolve")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void update("DISMISSED")}
        className="border-border rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50"
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
