"use client";

import { useState } from "react";
import { requestJson } from "@/backend/client/api";
import { useRouter } from "@/i18n/navigation";

type Props = {
  vacancyId: string;
  initialStatus: "ACTIVE" | "CLOSED" | "CANCELLED";
};

export function AdminVacancyActions({ vacancyId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function toggleStatus() {
    if (busy) return;
    const nextStatus = status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    setBusy(true);
    const res = await requestJson<{ ok: boolean; status: Props["initialStatus"] }>(
      "PATCH",
      `/api/admin/vacancies/${vacancyId}`,
      { status: nextStatus },
    );
    setBusy(false);
    if (res.ok) {
      setStatus(res.data.status);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (busy) return;
    if (!window.confirm("Ushbu vakansiyani butunlay o'chirmoqchimisiz?")) {
      return;
    }
    setBusy(true);
    const res = await requestJson("DELETE", `/api/admin/vacancies/${vacancyId}`);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={toggleStatus}
        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
          status === "ACTIVE"
            ? "border-amber-500/35 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
            : "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
        }`}
      >
        {status === "ACTIVE" ? "Yopish" : "Faollashtirish"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={handleDelete}
        className="border-red-500/35 bg-danger-soft text-danger hover:bg-red-500/20 cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50"
      >
        {"O'chirish"}
      </button>
    </div>
  );
}
