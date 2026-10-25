"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import {
  Field,
  FormAlert,
  SubmitButton,
  useErrorText,
} from "@/components/ui/form";
import { requestJson } from "@/lib/client/api";
import { COMPANY_SIZES } from "@/lib/company/sizes";

export type CompanyProfileValues = {
  name: string | null;
  country: string | null;
  industry: string | null;
  size: string | null;
  contactPerson: string | null;
};

export function CompanyProfileForm({
  initial,
}: {
  initial: CompanyProfileValues;
}) {
  const t = useTranslations("Company");
  const errorText = useErrorText();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const set = (key: keyof CompanyProfileValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});
    const result = await requestJson("PUT", "/api/company/me", {
      name: values.name ?? "",
      country: values.country || null,
      industry: values.industry || null,
      size: values.size || null,
      contactPerson: values.contactPerson || null,
    });
    setPending(false);
    if (result.ok) setSaved(true);
    else {
      setError(result.error);
      setFields(result.fields ?? {});
    }
  }

  const text = (
    key: Exclude<keyof CompanyProfileValues, "size">,
    max: number,
  ) => (
    <Field
      name={key}
      label={t(`profile.${key}`)}
      value={values[key] ?? ""}
      maxLength={max}
      required={key === "name"}
      onChange={(event) => set(key)(event.target.value)}
      error={errorText(fields[key])}
    />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("name", 120)}
        {text("contactPerson", 100)}
        {text("country", 60)}
        {text("industry", 100)}
        <div className="space-y-1">
          <label htmlFor="size" className="block text-sm font-medium">
            {t("profile.size")}
          </label>
          <select
            id="size"
            name="size"
            value={values.size ?? ""}
            onChange={(event) => set("size")(event.target.value)}
            className="border-border bg-surface w-full rounded-lg border px-3 py-2"
          >
            <option value="">{t("profile.sizeNone")}</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {t(`sizes.${size}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FormAlert>
        {errorText(error === "VALIDATION" ? undefined : error)}
      </FormAlert>
      {saved ? (
        <FormAlert tone="success">{t("profile.saved")}</FormAlert>
      ) : null}
      <SubmitButton pending={pending}>{t("profile.save")}</SubmitButton>
    </form>
  );
}
