"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CvDocumentLabels, CvDocumentLanguage } from "@/backend/cv-document/types";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { postJson } from "@/backend/client/api";
import type { WorkType } from "@prisma/client";
import type { CvDraft } from "./types";
import { getSuggestedSkillsForTitle } from "./profession-skills";

const SUGGESTED_LANGUAGES = [
  { name: "Qaraqalpaq tili", level: "Ona tili" },
  { name: "O'zbek tili", level: "Ona tili" },
  { name: "Ingliz tili", level: "B2 - Upper-Intermediate" },
  { name: "Rus tili", level: "B2 - Upper-Intermediate" },
  { name: "Nemis tili", level: "B1 - Intermediate" },
];

type Props = {
  draft: CvDraft;
  labels: CvDocumentLabels;
  saving: boolean;
  isVisible: boolean;
  onToggleVisibility: (visible: boolean) => void;
  onChange: (draft: CvDraft) => void;
  onSave: () => void;
  onRestart: () => void;
};

export function CvStepBuilder({
  draft,
  labels,
  saving,
  isVisible,
  onToggleVisibility,
  onChange,
  onSave,
  onRestart,
}: Props) {
  const t = useTranslations("StudentCv.onboarding");
  const tCv = useTranslations("StudentCv");
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingAboutMe, setGeneratingAboutMe] = useState(false);
  const [customSkills, setCustomSkills] = useState<string[] | null>(null);
  const [loadingAiSkills, setLoadingAiSkills] = useState(false);

  const suggestedSkills = customSkills ?? getSuggestedSkillsForTitle(draft.title);

  async function handleFetchAiSkills() {
    if (!draft.title) return;
    setLoadingAiSkills(true);
    try {
      const res = await postJson<{ ok: boolean; skills: string[] }>(
        "/api/cv/ai-skills",
        {
          jobTitle: draft.title,
          language: draft.language,
        },
      );
      if (res.ok && res.data.skills) {
        setCustomSkills(res.data.skills);
      }
    } finally {
      setLoadingAiSkills(false);
    }
  }

  const data = draft.data;

  // Split full name into first and last
  const nameParts = (data.fullName || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  function updateName(first: string, last: string) {
    const full = `${first.trim()} ${last.trim()}`.trim();
    onChange({ ...draft, data: { ...data, fullName: full } });
  }

  function updateContact(patch: Partial<typeof data.contact>) {
    onChange({
      ...draft,
      data: {
        ...data,
        contact: { ...data.contact, ...patch },
      },
    });
  }

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
    if (!data.languages.some((l) => l.name.toLowerCase() === lang.name.toLowerCase())) {
      onChange({
        ...draft,
        data: {
          ...data,
          languages: [...data.languages, { name: lang.name, level: lang.level }],
        },
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
      const education = data.education
        .map((e) => [e.institution, e.degree, e.field].filter(Boolean).join(" - "))
        .filter(Boolean);
      const experience = data.experience
        .map((e) => [e.position, e.organization, e.description].filter(Boolean).join(" at "))
        .filter(Boolean);
      const res = await postJson<{ ok: boolean; aboutMe: string }>(
        "/api/cv/ai-about-me",
        {
          jobTitle: draft.title,
          fullName: data.fullName,
          skills,
          education,
          experience,
          language: draft.language,
        },
      );
      if (res.ok && res.data.aboutMe) {
        onChange({
          ...draft,
          data: { ...data, goal: res.data.aboutMe },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAboutMe(false);
    }
  }

  const stepsList = [
    { id: 1, key: "contact", label: t("steps.contact") },
    { id: 2, key: "experience", label: t("steps.experience") },
    { id: 3, key: "education", label: t("steps.education") },
    { id: 4, key: "skills", label: t("steps.skills") },
    { id: 5, key: "summary", label: t("steps.summary") },
    { id: 6, key: "finalize", label: t("steps.finalize") },
  ];

  return (
    <div className="space-y-6">
      {/* Top Wizard Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">
            {currentStep}/6 — {stepsList[currentStep - 1]?.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="text-xs font-semibold text-muted hover:text-foreground"
          >
            {t("restartWizard")}
          </button>
        </div>
      </div>

      {/* Main 2-Column / Split Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Step Navigation (2 cols on desktop) */}
        <div className="lg:col-span-3">
          <nav className="sticky top-20 rounded-3xl border border-border bg-surface p-4 shadow-sm space-y-1.5">
            {stepsList.map((s) => {
              const isCurrent = currentStep === s.id;
              const isPast = currentStep > s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                    isCurrent
                      ? "bg-brand text-brand-foreground shadow"
                      : isPast
                        ? "text-foreground hover:bg-muted/40"
                        : "text-muted hover:bg-muted/20"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-white text-brand"
                        : isPast
                          ? "bg-emerald-500 text-white"
                          : "border border-border text-muted"
                    }`}
                  >
                    {isPast ? "✓" : s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center Column: Form Inputs (5 cols on desktop) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-6">
            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepContactTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepContactDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => updateName(e.target.value, lastName)}
                      placeholder="Elsa"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => updateName(firstName, e.target.value)}
                      placeholder="Manet"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">
                    {t("jobTitle")}
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => {
                      onChange({ ...draft, title: e.target.value });
                      setCustomSkills(null);
                    }}
                    placeholder={t("jobTitlePlaceholder")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">
                      Email
                    </label>
                    <input
                      type="email"
                      value={data.contact.email ?? ""}
                      onChange={(e) => updateContact({ email: e.target.value })}
                      placeholder="elsa.manet@gmail.com"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/80">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={data.contact.phone ?? ""}
                      onChange={(e) => updateContact({ phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">
                    {t("city")}
                  </label>
                  <input
                    type="text"
                    value={data.location ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        data: { ...data, location: e.target.value },
                      })
                    }
                    placeholder="Nukus, Toshkent"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Work Experience */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepExperienceTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepExperienceDesc")}
                  </p>
                </div>

                <div className="space-y-4">
                  {data.experience.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">
                          {item.position || item.organization || `#${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.experience.filter((_, i) => i !== index);
                            onChange({ ...draft, data: { ...data, experience: updated } });
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          {t("deleteEntry")}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.organization}
                          placeholder="Kompaniya / Tashkilot"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = { ...item, organization: e.target.value };
                            onChange({ ...draft, data: { ...data, experience: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.position ?? ""}
                          placeholder="Lavozim"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = { ...item, position: e.target.value };
                            onChange({ ...draft, data: { ...data, experience: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.startDate ?? ""}
                          placeholder="Boshlangan sana (masalan, 2022)"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = { ...item, startDate: e.target.value };
                            onChange({ ...draft, data: { ...data, experience: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.endDate ?? ""}
                          placeholder="Tugagan sana / Hozirgacha"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = { ...item, endDate: e.target.value };
                            onChange({ ...draft, data: { ...data, experience: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={item.description ?? ""}
                        placeholder="Vazifalar va yutuqlar..."
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[index] = { ...item, description: e.target.value };
                          onChange({ ...draft, data: { ...data, experience: updated } });
                        }}
                        className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [
                        ...data.experience,
                        { organization: "", position: "", startDate: "", endDate: "", description: "" },
                      ];
                      onChange({ ...draft, data: { ...data, experience: updated } });
                    }}
                    className="w-full rounded-xl border border-dashed border-brand/60 bg-brand/5 py-3 text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
                  >
                    {t("addExperience")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Education */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepEducationTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepEducationDesc")}
                  </p>
                </div>

                <div className="space-y-4">
                  {data.education.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-surface p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">
                          {item.institution || `#${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.education.filter((_, i) => i !== index);
                            onChange({ ...draft, data: { ...data, education: updated } });
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          {t("deleteEntry")}
                        </button>
                      </div>

                      <input
                        type="text"
                        value={item.institution}
                        placeholder="Universitet / Kollej nomi"
                        onChange={(e) => {
                          const updated = [...data.education];
                          updated[index] = { ...item, institution: e.target.value };
                          onChange({ ...draft, data: { ...data, education: updated } });
                        }}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.degree ?? ""}
                          placeholder="Daraja (masalan, Bakalavr)"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = { ...item, degree: e.target.value };
                            onChange({ ...draft, data: { ...data, education: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.field ?? ""}
                          placeholder="Yo'nalish (masalan, Kompyuter ilmlari)"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = { ...item, field: e.target.value };
                            onChange({ ...draft, data: { ...data, education: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.startYear ?? ""}
                          placeholder="Boshlangan yili"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = { ...item, startYear: e.target.value };
                            onChange({ ...draft, data: { ...data, education: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.endYear ?? ""}
                          placeholder="Tugash yili"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = { ...item, endYear: e.target.value };
                            onChange({ ...draft, data: { ...data, education: updated } });
                          }}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [
                        ...data.education,
                        { institution: "", degree: "", field: "", startYear: "", endYear: "" },
                      ];
                      onChange({ ...draft, data: { ...data, education: updated } });
                    }}
                    className="w-full rounded-xl border border-dashed border-brand/60 bg-brand/5 py-3 text-xs font-bold text-brand hover:bg-brand/10 transition-colors"
                  >
                    {t("addEducation")}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Skills & Languages */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepSkillsTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepSkillsDesc")}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground">
                    {tCv("fields.skills")}
                  </label>
                  <textarea
                    rows={3}
                    value={draft.skillsText}
                    onChange={(e) => onChange({ ...draft, skillsText: e.target.value })}
                    placeholder="JavaScript, React, Figma, Python..."
                    className="w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                  />

                  {/* Makemycv Suggestion Chips */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-muted">
                          {draft.title && draft.title.trim().length > 1
                            ? t("skillsFor", { title: draft.title })
                            : t("suggestedSkills")}
                        </span>
                        {draft.title && draft.title.trim().length > 1 ? (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                            {draft.title}
                          </span>
                        ) : null}
                      </div>

                      {draft.title && draft.title.trim().length > 1 ? (
                        <button
                          type="button"
                          disabled={loadingAiSkills}
                          onClick={handleFetchAiSkills}
                          className="rounded-lg border border-brand/40 bg-brand/5 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/10 disabled:opacity-60 transition-colors"
                        >
                          {loadingAiSkills ? t("aiSkillsLoading") : t("aiSkillsBtn")}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkillChip(skill)}
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
                        >
                          {`+ ${skill}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Languages with chips */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <label className="text-xs font-bold text-foreground">
                    {tCv("sections.languages")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.name}
                        type="button"
                        onClick={() => addLanguageChip(lang)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
                      >
                        {`+ ${lang.name}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Summary & AI Generator */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepSummaryTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepSummaryDesc")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {tCv("fields.goal")}
                    </label>

                    {/* AI About Me Generator */}
                    <button
                      type="button"
                      onClick={handleGenerateAboutMe}
                      disabled={generatingAboutMe}
                      className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                    >
                      {generatingAboutMe ? t("aiGenerating") : t("aiGenerateBtn")}
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={data.goal ?? ""}
                    onChange={(e) => onChange({ ...draft, data: { ...data, goal: e.target.value } })}
                    placeholder="Men IT va dasturlash sohasiga qiziquvchi, o'rganishga intiluvchan mutaxassisman..."
                    className="w-full rounded-xl border border-border bg-surface p-3.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Finalize & Template Selection */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t("stepFinalizeTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepFinalizeDesc")}
                  </p>
                </div>

                {/* Templates Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      {tCv("templates.title")}
                    </label>
                    <span className="text-[11px] font-semibold text-muted">
                      {tCv(`templates.${draft.templateId || "modern"}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        id: "modern",
                        name: tCv("templates.modern"),
                        desc: tCv("templates.modernDesc"),
                        color: "#F07A1A",
                      },
                      {
                        id: "classic",
                        name: tCv("templates.classic"),
                        desc: tCv("templates.classicDesc"),
                        color: "#1E3A8A",
                      },
                      {
                        id: "minimal",
                        name: tCv("templates.minimal"),
                        desc: tCv("templates.minimalDesc"),
                        color: "#27272A",
                      },
                    ].map((tpl) => {
                      const isSelected = draft.templateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...draft,
                              templateId: tpl.id as "modern" | "classic" | "minimal",
                            })
                          }
                          className={`group relative flex flex-col justify-between rounded-2xl border-2 p-3.5 text-left transition-all ${
                            isSelected
                              ? "border-brand bg-brand/5 shadow-md ring-2 ring-brand/30"
                              : "border-border bg-surface hover:border-brand/40"
                          }`}
                        >
                          {isSelected ? (
                            <div className="absolute top-2.5 right-2.5 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-brand-foreground shadow">
                              {tCv("templates.selectedBadge")}
                            </div>
                          ) : null}

                          {/* Mini visual template thumbnail */}
                          <div className="mb-3 flex h-20 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs">
                            {tpl.id === "modern" && (
                              <>
                                <div className="h-5 w-full bg-brand p-1 flex items-center justify-between">
                                  <div className="h-1.5 w-12 rounded-full bg-white/90" />
                                  <div className="h-1.5 w-5 rounded-full bg-white/60" />
                                </div>
                                <div className="p-2 space-y-1">
                                  <div className="h-1 w-full rounded-full bg-muted/40" />
                                  <div className="h-1 w-4/5 rounded-full bg-muted/30" />
                                  <div className="pt-1 flex gap-1">
                                    <div className="h-1.5 w-5 rounded bg-brand/30" />
                                    <div className="h-1.5 w-5 rounded bg-brand/30" />
                                  </div>
                                </div>
                              </>
                            )}
                            {tpl.id === "classic" && (
                              <div className="p-2 space-y-1.5">
                                <div className="border-b border-blue-900/40 pb-1 flex items-center justify-between">
                                  <div className="h-1.5 w-14 rounded-full bg-blue-900" />
                                  <div className="h-1 w-6 rounded-full bg-blue-800/60" />
                                </div>
                                <div className="grid grid-cols-3 gap-1 pt-0.5">
                                  <div className="h-7 rounded bg-blue-950/20 p-1 space-y-1">
                                    <div className="h-1 w-full rounded-full bg-blue-900/40" />
                                  </div>
                                  <div className="col-span-2 space-y-1">
                                    <div className="h-1 w-full rounded-full bg-muted/30" />
                                    <div className="h-1 w-3/4 rounded-full bg-muted/20" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {tpl.id === "minimal" && (
                              <div className="p-2 space-y-1.5">
                                <div className="flex items-center gap-1">
                                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                                  <div className="h-1.5 w-16 rounded-full bg-zinc-800" />
                                </div>
                                <div className="space-y-1 pt-1">
                                  <div className="h-1 w-full rounded-full bg-zinc-600/30" />
                                  <div className="h-1 w-4/5 rounded-full bg-zinc-600/20" />
                                  <div className="h-1 w-2/3 rounded-full bg-zinc-600/20" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 rounded-full shadow-xs"
                                style={{ backgroundColor: tpl.color }}
                              />
                              <span className="text-xs font-bold text-foreground">
                                {tpl.name}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted leading-tight">
                              {tpl.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <label className="text-xs font-bold text-foreground">
                    {tCv("privacy.title")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: "hidePhone", label: tCv("privacy.hidePhone") },
                      { key: "hideEmail", label: tCv("privacy.hideEmail") },
                      { key: "hidePhoto", label: tCv("privacy.hidePhoto") },
                      { key: "hideAddress", label: tCv("privacy.hideAddress") },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 rounded-xl border border-border p-2.5 bg-surface cursor-pointer hover:border-brand/40 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(draft.privacy?.[item.key as keyof typeof draft.privacy])}
                          onChange={(e) =>
                            onChange({
                              ...draft,
                              privacy: {
                                ...draft.privacy,
                                [item.key]: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="text-muted font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <span className="text-xs font-bold">{tCv("visibility.label")}</span>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => onToggleVisibility(e.target.checked)}
                    className="h-5 w-5 rounded text-brand focus:ring-brand"
                  />
                </div>
              </div>
            )}

            {/* Bottom Form Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-border px-5 py-2.5 text-xs font-bold text-muted hover:text-foreground disabled:opacity-30"
              >
                {t("prev")}
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                  className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow hover:opacity-95"
                >
                  {t("next")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSave}
                  className="rounded-xl bg-brand px-7 py-2.5 text-xs font-black text-brand-foreground shadow hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? tCv("save") : t("finish")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Document Paper Preview (4 cols on desktop) */}
        <div className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-20 rounded-3xl border border-border bg-muted/20 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                {t("livePreview")}
              </span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                {draft.templateId ?? "modern"}
              </span>
            </div>

            {/* A4 Paper Scaled Wrapper */}
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
              <div className="origin-top scale-[0.62] transform p-4 -mb-[38%]">
                <CvDocument
                  cv={{
                    data,
                    language: draft.language as CvDocumentLanguage,
                    workTypes: draft.workTypes as WorkType[],
                    templateId: draft.templateId,
                  }}
                  labels={labels}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
