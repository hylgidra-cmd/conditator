"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Field, FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { useRouter } from "@/i18n/navigation";
import { requestJson } from "@/backend/client/api";
import {
  VACANCY_CURRENCIES,
  VACANCY_TEXT_MAX,
  VACANCY_WORK_TYPES,
} from "@/backend/vacancy/schema";
import { LocationPickerModal } from "./location-picker-modal";
import { VacancyPersonalityPicker } from "./vacancy-personality-picker";

export type VacancyFormValues = {
  title: string;
  rawText: string;
  skills: string;
  languages: string;
  minExperienceYears: string;
  location: string;
  workType: string;
  salaryFrom: string;
  salaryTo: string;
  currency: "UZS" | "USD";
  status: "ACTIVE" | "CLOSED";
  professionId?: string | null;
  wantedTypes?: string[];
  wantedGroups?: string[];
};

export const EMPTY_VACANCY: VacancyFormValues = {
  title: "",
  rawText: "",
  skills: "",
  languages: "",
  minExperienceYears: "",
  location: "",
  workType: "",
  salaryFrom: "",
  salaryTo: "",
  currency: "UZS",
  status: "ACTIVE",
  professionId: null,
  wantedTypes: [],
  wantedGroups: [],
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mapOpen, setMapOpen] = useState(false);
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
    const salaryFromRaw = values.salaryFrom.trim();
    const salaryToRaw = values.salaryTo.trim();
    const body = {
      title: values.title || null,
      rawText: values.rawText || null,
      skills: list(values.skills),
      languages: list(values.languages),
      // Raqam bo'lmagan qiymat serverga shundayligicha boradi va u yerda rad etiladi.
      minExperienceYears: years === "" ? null : Number(years),
      location: values.location || null,
      workType: values.workType || null,
      salaryFrom: salaryFromRaw === "" ? null : Number(salaryFromRaw),
      salaryTo: salaryToRaw === "" ? null : Number(salaryToRaw),
      currency: values.currency,
      professionId: values.professionId ?? null,
      wantedTypes: values.wantedTypes ?? [],
      wantedGroups: values.wantedGroups ?? [],
      ...(vacancyId ? { status: values.status } : {}),
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

  async function onDelete() {
    if (!vacancyId || deleting || pending) return;
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }
    setDeleting(true);
    setError(undefined);
    const result = await requestJson("DELETE", `/api/vacancies/${vacancyId}`);
    setDeleting(false);
    if (result.ok) {
      router.push("/company/vacancies");
      router.refresh();
      return;
    }
    setError(result.error);
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
          <div className="space-y-1.5">
            <Field
              name="location"
              label={t("location")}
              value={values.location}
              maxLength={100}
              onChange={set("location")}
              error={errorText(fields.location)}
            />
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="border-border bg-surface hover:border-brand hover:text-brand inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            >
              {t("map.pickOnMap")}
            </button>
            <LocationPickerModal
              open={mapOpen}
              initialLocation={values.location}
              onSelect={(address) =>
                setValues((current) => ({ ...current, location: address }))
              }
              onClose={() => setMapOpen(false)}
            />
          </div>
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

        {/* Salary Range + Currency */}
        <div className="border-border/70 grid gap-4 border-t pt-4 sm:grid-cols-3">
          <Field
            name="salaryFrom"
            type="number"
            min={0}
            inputMode="numeric"
            label="Maosh (dan)"
            placeholder="Masalan: 4000000"
            value={values.salaryFrom}
            onChange={set("salaryFrom")}
            error={errorText(fields.salaryFrom)}
          />
          <Field
            name="salaryTo"
            type="number"
            min={0}
            inputMode="numeric"
            label="Maosh (gacha)"
            placeholder="Masalan: 8000000"
            value={values.salaryTo}
            onChange={set("salaryTo")}
            error={errorText(fields.salaryTo)}
          />
          <div className="space-y-1">
            <label htmlFor="currency" className="block text-sm font-medium">
              {"Valyuta"}
            </label>
            <select
              id="currency"
              value={values.currency}
              onChange={set("currency")}
              className="border-border bg-surface w-full rounded-lg border px-3 py-2"
            >
              {VACANCY_CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Qanday odam kerak? (shaxsiyat talabi) */}
        <VacancyPersonalityPicker
          professionId={values.professionId ?? null}
          wantedTypes={values.wantedTypes ?? []}
          wantedGroups={values.wantedGroups ?? []}
          onChange={(next) =>
            setValues((current) => ({
              ...current,
              professionId: next.professionId,
              wantedTypes: next.wantedTypes,
              wantedGroups: next.wantedGroups,
            }))
          }
        />

        {/* Status toggle on edit */}
        {vacancyId ? (
          <div className="border-border/70 border-t pt-4">
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              {"Vakansiya holati"}
            </label>
            <select
              id="status"
              value={values.status}
              onChange={set("status")}
              className="border-border bg-surface w-full rounded-lg border px-3 py-2 sm:max-w-xs"
            >
              <option value="ACTIVE">{"Faol (nomzodlarga ko'rinadi)"}</option>
              <option value="CLOSED">
                {"Yopilgan (yangi arizalar to'xtatilgan)"}
              </option>
            </select>
          </div>
        ) : null}
      </fieldset>

      <FormAlert>
        {errorText(error === "VALIDATION" ? undefined : error)}
      </FormAlert>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending || deleting}
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

        {vacancyId ? (
          <button
            type="button"
            disabled={pending || deleting}
            onClick={onDelete}
            className="border-red-500/35 bg-danger-soft text-danger hover:bg-red-500/20 cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
          >
            {deleting ? "O'chirilmoqda..." : "Vakansiyani o'chirish"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
