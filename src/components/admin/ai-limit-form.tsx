"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert, useErrorText } from "@/components/ui/form";
import { requestJson } from "@/lib/client/api";

export function AiLimitForm({ initial }: { initial: number }) {
  const t = useTranslations("Admin.dashboard.ai");
  const errorText = useErrorText();
  const router = useRouter();
  const [value, setValue] = useState(String(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    setSaved(false);
    const number = Number(value.replace(",", "."));
    const result = await requestJson("PUT", "/api/admin/ai", {
      limitUsd: value.trim() === "" || Number.isNaN(number) ? null : number,
    });
    setSaving(false);
    if (!result.ok)
      return setError(result.fields ? "INVALID_LIMIT" : result.error);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="limitUsd" className="block text-sm font-medium">
        {t("limitLabel")}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="limitUsd"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="border-border bg-surface w-32 rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold disabled:opacity-60"
        >
          {t("save")}
        </button>
      </div>
      <FormAlert>
        {error === "INVALID_LIMIT" ? t("invalidLimit") : errorText(error)}
      </FormAlert>
      {saved ? <FormAlert tone="success">{t("saved")}</FormAlert> : null}
    </form>
  );
}
