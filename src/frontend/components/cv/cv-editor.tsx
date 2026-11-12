"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type CvField, missingFields } from "@/backend/cv/schema";
import { type CvDraft, dataFromDraft, type WorkTypeValue } from "./types";

const WORK_TYPES: WorkTypeValue[] = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
];
const INPUT =
  "border-border bg-surface focus:border-brand focus:ring-brand-soft w-full rounded-lg border px-3 py-2 outline-none focus:ring-2";

type Props = {
  draft: CvDraft;
  errors: Record<string, string>;
  errorText: (code: string | undefined) => string | undefined;
  onChange: (draft: CvDraft) => void;
};

export function CvEditor({ draft, errors, errorText, onChange }: Props) {
  const t = useTranslations("StudentCv");
  const missing = new Set<CvField>(missingFields(dataFromDraft(draft)));
  const data = draft.data;

  const setData = (patch: Partial<CvDraft["data"]>) =>
    onChange({ ...draft, data: { ...data, ...patch } });

  /** Ro'yxat elementini yangilash yordamchisi (ta'lim, tajriba, tillar). */
  function updateItem<K extends "education" | "experience" | "languages">(
    key: K,
    index: number,
    patch: Partial<CvDraft["data"][K][number]>,
  ) {
    const items = [...data[key]] as CvDraft["data"][K];
    items[index] = { ...items[index], ...patch };
    setData({ [key]: items } as Partial<CvDraft["data"]>);
  }

  function removeItem(
    key: "education" | "experience" | "languages",
    index: number,
  ) {
    setData({ [key]: data[key].filter((_, i) => i !== index) } as Partial<
      CvDraft["data"]
    >);
  }

  const text = (
    field: string,
    label: string,
    value: string | null,
    onValue: (value: string | null) => void,
    options: { missingKey?: CvField; multiline?: boolean; type?: string } = {},
  ) => (
    <TextField
      id={field}
      label={label}
      value={value ?? ""}
      onValue={(next) => onValue(next === "" ? null : next)}
      missing={options.missingKey ? missing.has(options.missingKey) : false}
      fillIn={t("fillIn")}
      error={errorText(errors[field])}
      multiline={options.multiline}
      type={options.type}
    />
  );

  return (
    <div className="space-y-4">
      <Section title={t("sections.personal")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {text(
            "data.fullName",
            t("fields.fullName"),
            data.fullName,
            (v) => setData({ fullName: v }),
            {
              missingKey: "fullName",
            },
          )}
          {text(
            "data.location",
            t("fields.location"),
            data.location,
            (v) => setData({ location: v }),
            {
              missingKey: "location",
            },
          )}
          {text(
            "data.contact.phone",
            t("fields.phone"),
            data.contact.phone,
            (v) => setData({ contact: { ...data.contact, phone: v } }),
            { missingKey: "phone", type: "tel" },
          )}
          {text(
            "data.contact.email",
            t("fields.email"),
            data.contact.email,
            (v) => setData({ contact: { ...data.contact, email: v } }),
            { missingKey: "email", type: "email" },
          )}
        </div>
      </Section>

      <Section
        title={t("sections.goal")}
        missing={missing.has("goal")}
        fillIn={t("fillIn")}
      >
        {text(
          "data.goal",
          t("fields.goal"),
          data.goal,
          (v) => setData({ goal: v }),
          { multiline: true },
        )}
      </Section>

      <Section
        title={t("sections.education")}
        missing={missing.has("education")}
        fillIn={t("fillIn")}
      >
        {data.education.map((item, index) => (
          <ItemCard
            key={index}
            onRemove={() => removeItem("education", index)}
            removeLabel={t("remove")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {text(
                `data.education.${index}.institution`,
                t("fields.institution"),
                item.institution,
                (v) => updateItem("education", index, { institution: v ?? "" }),
              )}
              {text(
                `data.education.${index}.degree`,
                t("fields.degree"),
                item.degree,
                (v) => updateItem("education", index, { degree: v }),
              )}
              {text(
                `data.education.${index}.field`,
                t("fields.field"),
                item.field,
                (v) => updateItem("education", index, { field: v }),
              )}
              <div className="grid grid-cols-2 gap-3">
                {text(
                  `data.education.${index}.startYear`,
                  t("fields.startYear"),
                  item.startYear,
                  (v) => updateItem("education", index, { startYear: v }),
                )}
                {text(
                  `data.education.${index}.endYear`,
                  t("fields.endYear"),
                  item.endYear,
                  (v) => updateItem("education", index, { endYear: v }),
                )}
              </div>
            </div>
          </ItemCard>
        ))}
        <AddButton
          label={t("add")}
          onClick={() =>
            setData({
              education: [
                ...data.education,
                {
                  institution: "",
                  degree: null,
                  field: null,
                  startYear: null,
                  endYear: null,
                },
              ],
            })
          }
        />
      </Section>

      <Section
        title={t("sections.experience")}
        missing={missing.has("experience")}
        fillIn={t("fillIn")}
      >
        {data.experience.map((item, index) => (
          <ItemCard
            key={index}
            onRemove={() => removeItem("experience", index)}
            removeLabel={t("remove")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {text(
                `data.experience.${index}.organization`,
                t("fields.organization"),
                item.organization,
                (v) =>
                  updateItem("experience", index, { organization: v ?? "" }),
              )}
              {text(
                `data.experience.${index}.position`,
                t("fields.position"),
                item.position,
                (v) => updateItem("experience", index, { position: v }),
              )}
              {text(
                `data.experience.${index}.startDate`,
                t("fields.startDate"),
                item.startDate,
                (v) => updateItem("experience", index, { startDate: v }),
              )}
              {text(
                `data.experience.${index}.endDate`,
                t("fields.endDate"),
                item.endDate,
                (v) => updateItem("experience", index, { endDate: v }),
              )}
            </div>
            <div className="mt-3">
              {text(
                `data.experience.${index}.description`,
                t("fields.description"),
                item.description,
                (v) => updateItem("experience", index, { description: v }),
                { multiline: true },
              )}
            </div>
          </ItemCard>
        ))}
        <AddButton
          label={t("add")}
          onClick={() =>
            setData({
              experience: [
                ...data.experience,
                {
                  organization: "",
                  position: null,
                  startDate: null,
                  endDate: null,
                  description: null,
                },
              ],
            })
          }
        />
      </Section>

      <Section
        title={t("sections.skills")}
        missing={missing.has("skills")}
        fillIn={t("fillIn")}
      >
        <TextField
          id="data.skills"
          label={t("fields.skills")}
          hint={t("fields.skillsHint")}
          value={draft.skillsText}
          onValue={(value) => onChange({ ...draft, skillsText: value })}
          error={errorText(firstErrorWithPrefix(errors, "data.skills"))}
        />
      </Section>

      <Section
        title={t("sections.languages")}
        missing={missing.has("languages")}
        fillIn={t("fillIn")}
      >
        {data.languages.map((item, index) => (
          <ItemCard
            key={index}
            onRemove={() => removeItem("languages", index)}
            removeLabel={t("remove")}
          >
            <div className="grid grid-cols-2 gap-3">
              {text(
                `data.languages.${index}.name`,
                t("fields.languageName"),
                item.name,
                (v) => updateItem("languages", index, { name: v ?? "" }),
              )}
              {text(
                `data.languages.${index}.level`,
                t("fields.languageLevel"),
                item.level,
                (v) => updateItem("languages", index, { level: v }),
              )}
            </div>
          </ItemCard>
        ))}
        <AddButton
          label={t("add")}
          onClick={() =>
            setData({
              languages: [...data.languages, { name: "", level: null }],
            })
          }
        />
      </Section>

      <Section
        title={t("sections.certificates")}
        missing={missing.has("certificates")}
        fillIn={t("fillIn")}
      >
        <TextField
          id="data.certificates"
          label={t("fields.certificates")}
          hint={t("fields.certificatesHint")}
          value={draft.certificatesText}
          onValue={(value) => onChange({ ...draft, certificatesText: value })}
          error={errorText(firstErrorWithPrefix(errors, "data.certificates"))}
          multiline
        />
      </Section>

      <Section title={t("sections.workTypes")}>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPES.map((type) => (
            <label
              key={type}
              className="border-border has-[:checked]:border-brand has-[:checked]:bg-brand-soft flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={draft.workTypes.includes(type)}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    workTypes: event.target.checked
                      ? [...draft.workTypes, type]
                      : draft.workTypes.filter((item) => item !== type),
                  })
                }
              />
              {t(`workTypes.${type}`)}
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

function firstErrorWithPrefix(
  errors: Record<string, string>,
  prefix: string,
): string | undefined {
  return Object.entries(errors).find(
    ([key]) => key === prefix || key.startsWith(`${prefix}.`),
  )?.[1];
}

function Section({
  title,
  missing,
  fillIn,
  children,
}: {
  title: string;
  missing?: boolean;
  fillIn?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-surface space-y-3 rounded-2xl border p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-semibold">
        {title}
        {missing ? <FillInBadge label={fillIn ?? ""} /> : null}
      </h3>
      {children}
    </section>
  );
}

function FillInBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      {label}
    </span>
  );
}

function ItemCard({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="border-border rounded-xl border p-3">
      {children}
      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600 underline"
        >
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-brand text-sm font-medium"
    >
      {label}
    </button>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
  hint?: string;
  error?: string;
  missing?: boolean;
  fillIn?: string;
  multiline?: boolean;
  type?: string;
}) {
  const common = {
    id: props.id,
    value: props.value,
    "aria-invalid": props.error ? true : undefined,
    className: `${INPUT} ${props.missing ? "border-amber-300 bg-amber-50" : ""}`,
  };
  return (
    <div className="space-y-1">
      <label
        htmlFor={props.id}
        className="flex items-center gap-2 text-sm font-medium"
      >
        {props.label}
        {props.missing ? <FillInBadge label={props.fillIn ?? ""} /> : null}
      </label>
      {props.multiline ? (
        <textarea
          {...common}
          rows={3}
          onChange={(event) => props.onValue(event.target.value)}
        />
      ) : (
        <input
          {...common}
          type={props.type ?? "text"}
          onChange={(event) => props.onValue(event.target.value)}
        />
      )}
      {props.hint && !props.error ? (
        <p className="text-muted text-xs">{props.hint}</p>
      ) : null}
      {props.error ? (
        <p className="text-sm text-red-600">{props.error}</p>
      ) : null}
    </div>
  );
}
