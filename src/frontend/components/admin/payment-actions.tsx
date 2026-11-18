"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/backend/client/api";
import { CheckIcon } from "@/frontend/components/icons";

export function AdminPaymentRowActions({
  paymentId,
  initialStatus,
  hasReceipt,
}: {
  paymentId: string;
  initialStatus: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  hasReceipt: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "APPROVE" | "REJECT") {
    if (loading) return;
    setLoading(action);
    setError(null);
    const res = await requestJson<{ ok: boolean; status: typeof status }>(
      "PATCH",
      `/api/admin/payments/${paymentId}`,
      { action },
    );
    setLoading(null);
    if (res.ok) {
      setStatus(res.data.status);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasReceipt ? (
        <a
          href={`/api/payments/${paymentId}/receipt`}
          target="_blank"
          rel="noreferrer"
          className="border-line bg-card-cool text-primary-text hover:border-primary inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-colors"
        >
          <span>{"🖼 Chekni ko'rish"}</span>
        </a>
      ) : null}

      {status === "PENDING" ? (
        <>
          <button
            type="button"
            disabled={Boolean(loading)}
            onClick={() => handleAction("APPROVE")}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition-all hover:brightness-105 disabled:opacity-50"
          >
            <CheckIcon size={13} />
            <span>
              {loading === "APPROVE" ? "Tasdiqlanmoqda..." : "Qabul qilindi"}
            </span>
          </button>
          <button
            type="button"
            disabled={Boolean(loading)}
            onClick={() => handleAction("REJECT")}
            className="bg-danger-soft text-danger hover:bg-danger hover:text-on-primary cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {loading === "REJECT" ? "..." : "Rad etish"}
          </button>
        </>
      ) : status === "COMPLETED" ? (
        <span className="bg-success-soft text-success inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold">
          <CheckIcon size={12} />
          <span>{"Qabul qilingan"}</span>
        </span>
      ) : (
        <span className="bg-danger-soft text-danger rounded-full px-3 py-1 text-xs font-bold">
          {status}
        </span>
      )}

      {error ? (
        <span className="text-danger text-[11px] font-bold">{error}</span>
      ) : null}
    </div>
  );
}
