"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { type CvField, missingFields } from "@/backend/cv/schema";
import { postJson } from "@/backend/client/api";
import { type CvDraft, dataFromDraft, type WorkTypeValue } from "./types";

const WORK_TYPES: WorkTypeValue[] = [
  "FULL_TIME",
  "PART_TIME",
  "REMOTE",
  "INTERNSHIP",
];
const INPUT =
  "border-border bg-surface focus:border-brand focus:ring-brand-soft w-full rounded-lg border px-3 py-2 outline-none focus:ring-2";

const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Git",
  "Figma",
  "UI/UX",
  "SMM",
  "Copywriting",
  "Sales",
  "Mijozlar bilan ishlash",
  "Buxgalteriya",
  "Excel",
];

const SUGGESTED_LANGUAGES = [
  { name: "Qaraqalpaq tili", level: "Ona tili" },
  { name: "O'zbek tili", level: "Ona tili" },
  { name: "Ingliz tili", level: "B2 - Upper-Intermediate" },
  { name: "Rus tili", level: "B2 - Upper-Intermediate" },
  { name: "Nemis tili", level: "B1 - Intermediate" },
  { name: "Turk tili", level: "B1 - Intermediate" },
];

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
  const [generatingAboutMe, setGeneratingAboutMe] = useState(false);

  const setData = (patch: Partial<CvDraft["data"]>) =>
    onChange({ ...draft, data: { ...data, ...patch } });

  function addSkillChip(skill: string) {
    const current = draft.skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!current.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      const updated = [...current, skill].join(", ");
      onChange({ ...draft, skillsText: updated });
    }
  }

  function addLanguageChip(lang: { name: string; level: string }) {
    if (
      !data.languages.some(
        (l) => l.name.toLowerCase() === lang.name.toLowerCase(),
      )
    ) {
      setData({
        languages: [...data.languages, { name: lang.name, level: lang.level }],
      });
    }
  }

  async function handleGenerateAboutMe() {
    setGeneratingAboutMe(true);
    try {
      const skills = draft.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const education = data.education.map((e) => e.institution);
      const experience = data.experience.map(
        (e) => `${e.position || ""} at ${e.organization}`,
      );
      const res = await postJson<{ ok: boolean; aboutMe: string }>(
        "/api/cv/ai-about-me",
        {
          skills,
          education,
          experience,
          language: draft.language,
        },
      );
      if (res.ok && res.data.aboutMe) {
        setData({ goal: res.data.aboutMe });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAboutMe(false);
    }
  }

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
      <Section title={t("templates.title")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["modern", "classic", "minimal"] as const).map((tmpl) => (
            <button
              key={tmpl}
              type="button"
              onClick={() => onChange({ ...draft, templateId: tmpl })}
              className={`flex flex-col items-center justify-center rounded-xl border p-4 text-sm font-semibold transition-all ${
                draft.templateId === tmpl
                  ? "border-brand bg-brand-soft ring-brand ring-2"
                  : "border-border bg-surface hover:border-gray-400"
              }`}
            >
              <span className="capitalize">{t(`templates.${tmpl}`)}</span>
              <span className="text-muted mt-1 text-xs font-normal">
                {tmpl === "modern"
                  ? "Zamonaviy dizayn"
                  : tmpl === "classic"
                    ? "Klassik korporativ"
                    : "Minimalist va toza"}
              </span>
            </button>
          ))}
        </div>
      </Section>

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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerateAboutMe}
            disabled={generatingAboutMe}
            className="text-brand bg-brand-soft hover:bg-brand/10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {generatingAboutMe
              ? t("chips.generatingAboutMe")
              : t("chips.generateAboutMe")}
          </button>
        </div>
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
        <div className="space-y-1.5 pt-2">
          <p className="text-muted text-xs font-medium">
            {t("chips.skillsTitle")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkillChip(skill)}
                className="bg-surface hover:bg-brand-soft hover:border-brand border-border text-foreground rounded-full border px-2.5 py-1 text-xs transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <AddButton
            label={t("add")}
            onClick={() =>
              setData({
                languages: [...data.languages, { name: "", level: null }],
              })
            }
          />
        </div>
        <div className="space-y-1.5 pt-2">
          <p className="text-muted text-xs font-medium">
            {t("chips.languagesTitle")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_LANGUAGES.map((lang) => (
              <button
                key={lang.name}
                type="button"
                onClick={() => addLanguageChip(lang)}
                className="bg-surface hover:bg-brand-soft hover:border-brand border-border text-foreground rounded-full border px-2.5 py-1 text-xs transition-colors"
              >
                + {lang.name}
              </button>
            ))}
          </div>
        </div>
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

      <Section title={t("privacy.title")}>
        <p className="text-muted -mt-1 text-xs">{t("privacy.subtitle")}</p>
        <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
          {(
            [
              "hideName",
              "hidePhone",
              "hideEmail",
              "hideAddress",
              "hidePhoto",
            ] as const
          ).map((key) => (
            <label
              key={key}
              className="border-border has-[:checked]:border-brand has-[:checked]:bg-brand-soft flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={Boolean(draft.privacy?.[key])}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    privacy: { ...draft.privacy, [key]: e.target.checked },
                  })
                }
              />
              <span>{t(`privacy.${key}`)}</span>
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
