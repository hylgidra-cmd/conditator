"use client";

import type { Approval } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useErrorText } from "@/frontend/components/ui/form";
import { requestJson } from "@/backend/client/api";

/** Tasdiqlash / rad etish va obuna (tugash sanasi yoki o'chirish). */
export function CompanyAdminActions({
  companyId,
  approval,
  subscriptionDate,
  defaultDate,
}: {
  companyId: string;
  approval: Approval;
  /** Joriy tugash sanasi "yyyy-MM-dd" yoki null. */
  subscriptionDate: string | null;
  /** Yangi obuna uchun taklif: bugundan +30 kun. */
  defaultDate: string;
}) {
  const t = useTranslations("Admin.companies");
  const errorText = useErrorText();
  const router = useRouter();
  const [date, setDate] = useState(subscriptionDate ?? defaultDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function send(path: string, body: unknown) {
    setBusy(true);
    setError(undefined);
    const result = await requestJson(
      "PATCH",
      `/api/admin/companies/${companyId}/${path}`,
      body,
    );
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.fields ? "VALIDATION" : result.error);
  }

  const button =
    "rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-60";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {approval !== "APPROVED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("approve", { approved: true })}
            className={`${button} border-green-600 bg-green-600 text-white`}
          >
            {t("approve")}
          </button>
        ) : null}
        {approval !== "REJECTED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("approve", { approved: false })}
            className={`${button} border-red-300 text-red-700`}
          >
            {t("reject")}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label
            htmlFor={`until-${companyId}`}
            className="block text-xs font-medium"
          >
            {t("until")}
          </label>
          <input
            id={`until-${companyId}`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="border-border bg-surface rounded-lg border px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={busy || !date}
          onClick={() => send("subscription", { until: date })}
          className={`${button} border-brand text-brand`}
        >
          {subscriptionDate ? t("saveSub") : t("enableSub")}
        </button>
        {subscriptionDate ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => send("subscription", { until: null })}
            className={`${button} border-border`}
          >
            {t("disableSub")}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600">{errorText(error)}</p>
      ) : null}
    </div>
  );
}
