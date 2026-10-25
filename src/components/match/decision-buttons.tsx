"use client";

import type { MatchDecision } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert, useErrorText } from "@/components/ui/form";
import { requestJson } from "@/lib/client/api";

const STYLES: Record<Exclude<MatchDecision, "NONE">, string> = {
  SELECTED: "border-green-600 bg-green-600 text-white",
  REJECTED: "border-gray-600 bg-gray-600 text-white",
};

/** "Tanlandi" / "Mos emas". Faol tugmani qayta bossangiz, belgi olib tashlanadi. */
export function DecisionButtons({
  vacancyId,
  cvId,
  initial,
}: {
  vacancyId: string;
  cvId: string;
  initial: MatchDecision;
}) {
  const t = useTranslations("Candidate.decision");
  const errorText = useErrorText();
  const [decision, setDecision] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function choose(next: Exclude<MatchDecision, "NONE">) {
    const value: MatchDecision = decision === next ? "NONE" : next;
    setSaving(true);
    setError(undefined);
    const result = await requestJson<{ decision: MatchDecision }>(
      "PUT",
      `/api/vacancies/${vacancyId}/candidates/${cvId}/decision`,
      { decision: value },
    );
    setSaving(false);
    if (result.ok) setDecision(result.data.decision);
    else setError(result.error);
  }

  return (
    <div className="border-border bg-surface space-y-2 rounded-2xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t("label")}</span>
        {(["SELECTED", "REJECTED"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={saving}
            aria-pressed={decision === value}
            onClick={() => choose(value)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
              decision === value ? STYLES[value] : "border-border bg-surface"
            }`}
          >
            {t(value)}
          </button>
        ))}
        <span className="text-muted text-sm" role="status">
          {decision === "NONE" ? t("none") : t("hint")}
        </span>
      </div>
      <FormAlert>{errorText(error)}</FormAlert>
    </div>
  );
}
