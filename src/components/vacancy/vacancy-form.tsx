"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Field, FormAlert, useErrorText } from "@/components/ui/form";
import { useRouter } from "@/i18n/navigation";
import { requestJson } from "@/lib/client/api";
import { VACANCY_TEXT_MAX, VACANCY_WORK_TYPES } from "@/lib/vacancy/schema";

export type VacancyFormValues = {
  title: string;
  rawText: string;
  skills: string;
  languages: string;
  minExperienceYears: string;
  location: string;
  workType: string;
};

export const EMPTY_VACANCY: VacancyFormValues = {
  title: "",
  rawText: "",
  skills: "",
  languages: "",
  minExperienceYears: "",
  location: "",
  workType: "",
};

const list = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function VacancyForm({
  initial,
  vacancyId,
}: {
  initial: VacancyFormValues;
  /** Bo'lsa tahrirlash (PUT), bo'lmasa yangi talab (POST). */
  vacancyId?: string;
}) {
  const t = useTranslations("Vacancies.form");
  const tWork = useTranslations("StudentCv.workTypes");
  const errorText = useErrorText();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const count = Array.from(values.rawText).length;

  const set =
    (key: keyof VacancyFormValues) => (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setFields({});
    const years = values.minExperienceYears.trim();
    const body = {
      title: values.title || null,
      rawText: values.rawText || null,
      skills: list(values.skills),
      languages: list(values.languages),
      // Raqam bo'lmagan qiymat serverga shundayligicha boradi va u yerda rad etiladi.
      minExperienceYears: years === "" ? null : Number(years),
      location: values.location || null,
      workType: values.workType || null,
    };
    const result = vacancyId
      ? await requestJson("PUT", `/api/vacancies/${vacancyId}`, body)
      : await requestJson("POST", "/api/vacancies", body);
    setPending(false);
    if (result.ok) {
      router.push("/company/vacancies");
      router.refresh();
      return;
    }
    setError(result.error);
    setFields(result.fields ?? {});
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="rawText" className="block text-sm font-medium">
          {t("rawText")}
        </label>
        <p className="text-muted text-xs">{t("rawTextHint")}</p>
        <textarea
          id="rawText"
          rows={7}
          value={values.rawText}
          onChange={set("rawText")}
          aria-invalid={fields.rawText ? true : undefined}
          className="border-border focus:border-brand focus:ring-brand-soft w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
        />
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-red-600">{errorText(fields.rawText)}</span>
          <span
            className={count > VACANCY_TEXT_MAX ? "text-red-600" : "text-muted"}
          >
            {t("counter", { count, max: VACANCY_TEXT_MAX })}
          </span>
        </div>
      </div>

      <fieldset className="border-border space-y-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-semibold">
          {t("fieldsTitle")}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="title"
            label={t("title")}
            value={values.title}
            maxLength={120}
            onChange={set("title")}
            error={errorText(fields.title)}
          />
          <Field
            name="location"
            label={t("location")}
            value={values.location}
            maxLength={100}
            onChange={set("location")}
            error={errorText(fields.location)}
          />
          <Field
            name="skills"
            label={t("skills")}
            hint={t("skillsHint")}
            value={values.skills}
            onChange={set("skills")}
            error={errorText(
              Object.entries(fields).find(([key]) =>
                key.startsWith("skills"),
              )?.[1],
            )}
          />
          <Field
            name="languages"
            label={t("languages")}
            hint={t("languagesHint")}
            value={values.languages}
            onChange={set("languages")}
            error={errorText(
              Object.entries(fields).find(([key]) =>
                key.startsWith("languages"),
              )?.[1],
            )}
          />
          <Field
            name="minExperienceYears"
            type="number"
            min={0}
            max={50}
            inputMode="numeric"
            label={t("minExperienceYears")}
            value={values.minExperienceYears}
            onChange={set("minExperienceYears")}
            error={errorText(fields.minExperienceYears)}
          />
          <div className="space-y-1">
            <label htmlFor="workType" className="block text-sm font-medium">
              {t("workType")}
            </label>
            <select
              id="workType"
              value={values.workType}
              onChange={set("workType")}
              className="border-border bg-surface w-full rounded-lg border px-3 py-2"
            >
              <option value="">{t("workTypeAny")}</option>
              {VACANCY_WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tWork(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <FormAlert>
        {errorText(error === "VALIDATION" ? undefined : error)}
      </FormAlert>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand text-brand-foreground rounded-lg px-5 py-2 font-semibold disabled:opacity-60"
        >
          {t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/company/vacancies")}
          className="border-border rounded-lg border px-5 py-2 font-medium"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
