"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  CvDocumentLabels,
  CvDocumentLanguage,
} from "@/backend/cv-document/types";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { postJson } from "@/backend/client/api";
import type { WorkType } from "@prisma/client";
import type { CvDraft, CvTemplateId } from "./types";
import { getSuggestedSkillsForTitle } from "./profession-skills";
import {
  CV_TEMPLATE_CATEGORIES,
  CV_TEMPLATE_NAMES,
  CV_TEMPLATE_DESCRIPTIONS,
  isPhotoTemplate,
  listTemplates,
  getCategoryForTemplate,
  normalizeTemplateId,
} from "@/frontend/components/cv-templates/cv-templates";
import { PhotoCropperModal } from "./photo-cropper-modal";

const POPULAR_LANGUAGES = [
  "Qaraqalpaq tili",
  "O'zbek tili",
  "Ingliz tili",
  "Rus tili",
  "Nemis tili",
  "Turk tili",
  "Fransuz tili",
  "Koreys tili",
  "Xitoy tili",
  "Arab tili",
];

const LANGUAGE_LEVEL_OPTIONS = [
  { value: "Ona tili", label: "Ona tili (Native)" },
  { value: "C2 - Mukammal", label: "C2 - Mukammal (Mastery)" },
  { value: "C1 - Ilg'or", label: "C1 - Ilg'or (Advanced)" },
  {
    value: "B2 - O'rta-yuqori",
    label: "B2 - O'rta-yuqori (Upper-Intermediate)",
  },
  { value: "B1 - O'rta", label: "B1 - O'rta (Intermediate)" },
  {
    value: "A2 - Boshlang'ich-o'rta",
    label: "A2 - Boshlang'ich-o'rta (Elementary)",
  },
  { value: "A1 - Boshlang'ich", label: "A1 - Boshlang'ich (Beginner)" },
];

const POPULAR_HOBBIES = [
  "Dasturlash",
  "Kitobxonlik",
  "Shaxmat",
  "Futbol",
  "Musiqa",
  "Sayohat",
  "Fotografiya",
  "Volontyorlik",
  "Robototexnika",
];

const CV_LANGUAGES: Array<{ code: CvDocumentLanguage; label: string }> = [
  { code: "kk", label: "Qaraqalpaqsha" },
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

function TemplateThumbnail({ id }: { id: string }) {
  if (id === "modern-1") {
    return (
      <div className="flex h-full w-full">
        <div className="flex w-1/3 flex-col items-center gap-1 bg-[#1C1C1E] p-1.5">
          <div className="h-4 w-4 rounded-full border border-[#F97316] bg-[#2C2C2E]" />
          <div className="h-1 w-full rounded-full bg-white/20" />
          <div className="h-1 w-3/4 rounded-full bg-white/20" />
        </div>
        <div className="flex-1 space-y-1 bg-white p-1.5">
          <div className="h-1.5 w-3/4 rounded-full bg-[#111]" />
          <div className="h-1 w-1/2 rounded-full bg-[#F97316]" />
          <div className="bg-muted/30 h-1 w-full rounded-full pt-1" />
          <div className="bg-muted/20 h-1 w-4/5 rounded-full" />
        </div>
      </div>
    );
  }
  if (id === "modern-2") {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex h-6 w-full items-center gap-1 bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] p-1">
          <div className="h-4 w-4 rounded bg-white/30" />
          <div className="h-1.5 w-1/2 rounded-full bg-white" />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1 bg-white p-1">
          <div className="col-span-2 space-y-1">
            <div className="bg-muted/30 h-1 w-full rounded" />
            <div className="bg-muted/20 h-1 w-3/4 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full rounded bg-[#FFF1E6]" />
            <div className="h-1 w-full rounded bg-[#FFF1E6]" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "modern-3") {
    return (
      <div className="flex h-full w-full flex-col items-center space-y-1 bg-white p-1.5">
        <div className="h-4 w-4 rounded-full border-2 border-[#EA580C] bg-[#FFF1E6]" />
        <div className="h-1.5 w-12 rounded-full bg-[#111]" />
        <div className="flex w-full items-start gap-1 pt-1">
          <div className="flex h-8 w-1 items-center justify-center rounded bg-[#FBE3D3]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#EA580C]" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="bg-muted/30 h-1 w-full rounded" />
            <div className="bg-muted/20 h-1 w-2/3 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "modern-4") {
    return (
      <div className="flex h-full w-full">
        <div className="flex-1 space-y-1 bg-white p-1.5">
          <div className="h-2 w-3/4 rounded bg-[#111]" />
          <div className="h-1 w-8 rounded bg-[#F97316]" />
          <div className="bg-muted/30 h-1 w-full rounded" />
          <div className="bg-muted/20 h-1 w-3/4 rounded" />
        </div>
        <div className="flex w-1/3 flex-col items-center gap-1 bg-[#FFF4EC] p-1.5">
          <div className="h-5 w-5 rounded-lg bg-[#FFE1CC]" />
          <div className="h-1 w-full rounded bg-[#F97316]/40" />
        </div>
      </div>
    );
  }
  if (id === "modern-5") {
    return (
      <div className="flex h-full w-full flex-col bg-white">
        <div className="flex h-6 w-full items-center justify-between bg-[#18181B] p-1">
          <div className="h-1.5 w-1/2 rounded bg-[#F97316]" />
          <div className="h-4 w-4 rounded-full border-2 border-white bg-zinc-800" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1 p-1">
          <div className="space-y-1 rounded border-t-2 border-[#F97316] bg-zinc-100 p-1">
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
          <div className="space-y-1 rounded border-t-2 border-[#F97316] bg-zinc-100 p-1">
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "classic-1") {
    return (
      <div className="flex h-full w-full flex-col items-center space-y-1 bg-white p-1.5">
        <div className="h-1.5 w-16 rounded bg-[#1E3A8A]" />
        <div className="h-0.5 w-full bg-[#1E3A8A]" />
        <div className="w-full space-y-1 pt-0.5">
          <div className="h-1 w-full rounded bg-zinc-400" />
          <div className="h-1 w-4/5 rounded bg-zinc-300" />
          <div className="h-1 w-2/3 rounded bg-zinc-300" />
        </div>
      </div>
    );
  }
  if (id === "classic-2") {
    return (
      <div className="flex h-full w-full">
        <div className="flex w-1/3 flex-col items-center gap-1 bg-[#1E3A8A] p-1.5">
          <div className="h-4 w-4 rounded-full border-2 border-white bg-[#3554B0]" />
          <div className="h-1 w-full rounded bg-white/40" />
          <div className="h-1 w-2/3 rounded bg-white/30" />
        </div>
        <div className="flex-1 space-y-1 bg-white p-1.5">
          <div className="h-1.5 w-3/4 rounded bg-[#1E3A8A]" />
          <div className="bg-muted/40 h-1 w-full rounded" />
          <div className="bg-muted/30 h-1 w-4/5 rounded" />
        </div>
      </div>
    );
  }
  if (id === "classic-3") {
    return (
      <div className="flex h-full w-full flex-col bg-white">
        <div className="flex h-6 w-full items-center justify-between bg-[#172554] p-1">
          <div className="h-1.5 w-1/2 rounded bg-white" />
          <div className="h-3 w-3 rounded border border-[#C9A227] bg-[#1E3A8A]" />
        </div>
        <div className="h-0.5 w-full bg-[#C9A227]" />
        <div className="grid flex-1 grid-cols-3 gap-1 p-1">
          <div className="col-span-2 space-y-1">
            <div className="h-1 w-full rounded bg-zinc-400" />
            <div className="h-1 w-3/4 rounded bg-zinc-300" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "classic-4") {
    return (
      <div className="flex h-full w-full flex-col space-y-1 bg-white p-1.5">
        <div className="flex justify-between border-b-2 border-double border-[#1E3A8A] pb-0.5">
          <div className="h-1.5 w-12 rounded bg-[#1E3A8A]" />
          <div className="h-1 w-6 rounded bg-zinc-400" />
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1">
          <div className="h-1.5 w-6 rounded bg-[#1E3A8A]" />
          <div className="col-span-2 space-y-0.5">
            <div className="h-1 w-full rounded bg-zinc-400" />
            <div className="h-1 w-3/4 rounded bg-zinc-300" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "classic-5") {
    return (
      <div className="h-full w-full bg-white p-1">
        <div className="flex h-full w-full flex-col items-center space-y-1 border border-double border-[#1E3A8A] p-1">
          <div className="h-3 w-3 rounded-full border border-[#1E3A8A]" />
          <div className="h-1 w-10 rounded bg-[#1E3A8A]" />
          <div className="h-0.5 w-12 bg-zinc-300" />
          <div className="grid w-full grid-cols-2 gap-1">
            <div className="h-1 w-full rounded bg-zinc-300" />
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "minimal-1") {
    return (
      <div className="flex h-full w-full flex-col space-y-1.5 bg-white p-2">
        <div className="h-2 w-16 rounded bg-zinc-900" />
        <div className="h-1 w-10 rounded bg-zinc-400" />
        <div className="space-y-1 border-t border-zinc-200 pt-1">
          <div className="h-1 w-full rounded bg-zinc-300" />
          <div className="h-1 w-3/4 rounded bg-zinc-200" />
        </div>
      </div>
    );
  }
  if (id === "minimal-2") {
    return (
      <div className="flex h-full w-full flex-col space-y-1 bg-white p-1.5">
        <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
          <div className="h-1.5 w-12 rounded bg-zinc-900" />
          <div className="h-3 w-3 rounded bg-zinc-200" />
        </div>
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          <div className="h-1 w-6 rounded bg-zinc-500" />
          <div className="col-span-2 space-y-0.5">
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "minimal-3") {
    return (
      <div className="flex h-full w-full flex-col space-y-1 bg-white p-1.5">
        <div className="h-1.5 w-14 rounded bg-zinc-900" />
        <div className="h-1 w-8 rounded bg-zinc-500" />
        <div className="grid grid-cols-3 gap-1 border-t border-zinc-200 pt-1">
          <div className="col-span-2 space-y-1">
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
          <div className="space-y-1 border-l border-zinc-200 pl-1">
            <div className="h-1 w-full rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "minimal-4") {
    return (
      <div className="flex h-full w-full flex-col space-y-1 bg-white p-1.5">
        <div className="flex items-end justify-between border-b-2 border-black pb-1">
          <div className="h-3 w-16 rounded bg-black" />
          <div className="h-1 w-6 rounded bg-zinc-500" />
        </div>
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          <div className="col-span-2 space-y-1">
            <div className="h-1 w-full rounded bg-zinc-400" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full rounded bg-zinc-300" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center space-y-1 bg-white p-1.5">
      <div className="h-1.5 w-12 rounded bg-zinc-900" />
      <div className="h-0.5 w-full bg-zinc-300" />
      <div className="grid w-full grid-cols-3 gap-1 pt-0.5">
        <div className="space-y-0.5">
          <div className="h-1 w-full rounded bg-zinc-300" />
          <div className="h-1 w-2/3 rounded bg-zinc-200" />
        </div>
        <div className="space-y-0.5">
          <div className="h-1 w-full rounded bg-zinc-300" />
          <div className="h-1 w-2/3 rounded bg-zinc-200" />
        </div>
        <div className="space-y-0.5">
          <div className="h-1 w-full rounded bg-zinc-300" />
          <div className="h-1 w-2/3 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}

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
  const [customLangInput, setCustomLangInput] = useState("");
  const [customHobbyInput, setCustomHobbyInput] = useState("");
  const [zoomScale, setZoomScale] = useState(0.58);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const activeTemplateId = normalizeTemplateId(draft.templateId);
  const [selectedCategory, setSelectedCategory] = useState<
    "modern" | "classic" | "minimal"
  >(getCategoryForTemplate(activeTemplateId));

  function handlePhotoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropperSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function updateObyektivka(
    patch: Partial<NonNullable<typeof draft.data.obyektivka>>,
  ) {
    const current = draft.data.obyektivka ?? { qarindoshlar: [] };
    onChange({
      ...draft,
      data: {
        ...draft.data,
        obyektivka: {
          ...current,
          ...patch,
          qarindoshlar: patch.qarindoshlar ?? current.qarindoshlar ?? [],
        },
      },
    });
  }

  const suggestedSkills =
    customSkills ?? getSuggestedSkillsForTitle(draft.title);

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

  // --- Languages management ---
  function toggleLanguage(langName: string) {
    const exists = data.languages.some(
      (l) => l.name.toLowerCase() === langName.toLowerCase(),
    );
    if (exists) {
      const updated = data.languages.filter(
        (l) => l.name.toLowerCase() !== langName.toLowerCase(),
      );
      onChange({ ...draft, data: { ...data, languages: updated } });
    } else {
      const isNative = /qaraqalpaq|o'zbek|uzbek|karakalpak/i.test(langName);
      const defaultLevel = isNative ? "Ona tili" : "B2 - O'rta-yuqori";
      onChange({
        ...draft,
        data: {
          ...data,
          languages: [
            ...data.languages,
            { name: langName, level: defaultLevel },
          ],
        },
      });
    }
  }

  function handleAddCustomLanguage() {
    const trimmed = customLangInput.trim();
    if (!trimmed) return;
    if (
      !data.languages.some(
        (l) => l.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      onChange({
        ...draft,
        data: {
          ...data,
          languages: [
            ...data.languages,
            { name: trimmed, level: "B2 - O'rta-yuqori" },
          ],
        },
      });
    }
    setCustomLangInput("");
  }

  function updateLanguageLevel(index: number, level: string) {
    const updated = [...data.languages];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, level };
    onChange({ ...draft, data: { ...data, languages: updated } });
  }

  function removeLanguage(index: number) {
    const updated = data.languages.filter((_, i) => i !== index);
    onChange({ ...draft, data: { ...data, languages: updated } });
  }

  // --- Projects management ---
  const projectsList = data.projects || [];
  function addProject() {
    onChange({
      ...draft,
      data: {
        ...data,
        projects: [
          ...projectsList,
          { name: "", link: "", year: "", description: "" },
        ],
      },
    });
  }

  function updateProject(
    index: number,
    patch: Partial<(typeof projectsList)[number]>,
  ) {
    const updated = [...projectsList];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, ...patch };
    onChange({ ...draft, data: { ...data, projects: updated } });
  }

  function removeProject(index: number) {
    const updated = projectsList.filter((_, i) => i !== index);
    onChange({ ...draft, data: { ...data, projects: updated } });
  }

  // --- Certificates management ---
  const certsList = (data.certificates || []).map((c) =>
    typeof c === "string" ? { name: c, issuer: "", year: "" } : c,
  );

  function addCertificate() {
    onChange({
      ...draft,
      data: {
        ...data,
        certificates: [...certsList, { name: "", issuer: "", year: "" }],
      },
    });
  }

  function updateCertificate(
    index: number,
    patch: { name?: string; issuer?: string; year?: string },
  ) {
    const updated = [...certsList];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, ...patch };
    onChange({ ...draft, data: { ...data, certificates: updated } });
  }

  function removeCertificate(index: number) {
    const updated = certsList.filter((_, i) => i !== index);
    onChange({ ...draft, data: { ...data, certificates: updated } });
  }

  // --- Hobbies management ---
  const hobbiesList = data.hobbies || [];
  function toggleHobby(hobby: string) {
    if (hobbiesList.some((h) => h.toLowerCase() === hobby.toLowerCase())) {
      onChange({
        ...draft,
        data: {
          ...data,
          hobbies: hobbiesList.filter(
            (h) => h.toLowerCase() !== hobby.toLowerCase(),
          ),
        },
      });
    } else {
      onChange({
        ...draft,
        data: {
          ...data,
          hobbies: [...hobbiesList, hobby],
        },
      });
    }
  }

  function handleAddCustomHobby() {
    const trimmed = customHobbyInput.trim();
    if (!trimmed) return;
    if (!hobbiesList.some((h) => h.toLowerCase() === trimmed.toLowerCase())) {
      onChange({
        ...draft,
        data: {
          ...data,
          hobbies: [...hobbiesList, trimmed],
        },
      });
    }
    setCustomHobbyInput("");
  }

  async function handleGenerateAboutMe() {
    setGeneratingAboutMe(true);
    try {
      const skills = draft.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const education = data.education
        .map((e) =>
          [e.institution, e.degree, e.field].filter(Boolean).join(" - "),
        )
        .filter(Boolean);
      const experience = data.experience
        .map((e) =>
          [e.position, e.organization, e.description]
            .filter(Boolean)
            .join(" at "),
        )
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
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs font-bold tracking-wider uppercase">
            {currentStep}/6 — {stepsList[currentStep - 1]?.label}
          </span>
        </div>

        {/* CV Language Switcher in Header */}
        <div className="flex items-center gap-2">
          <span className="text-muted hidden text-[11px] font-semibold sm:inline">
            {t("cvLanguage")}:
          </span>
          <div className="bg-muted/20 border-border/60 flex rounded-xl border p-1">
            {CV_LANGUAGES.map((lang) => {
              const isActive = draft.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onChange({ ...draft, language: lang.code })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand text-brand-foreground shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="text-muted hover:text-foreground ml-2 text-xs font-semibold"
          >
            {t("restartWizard")}
          </button>
        </div>
      </div>

      {/* Main 3-Column / Responsive Split Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
        {/* Left Column: Step Navigation (2 cols on desktop) */}
        <div className="lg:col-span-2">
          <nav className="border-border bg-surface sticky top-20 space-y-1.5 rounded-3xl border p-3 shadow-sm">
            {stepsList.map((s) => {
              const isCurrent = currentStep === s.id;
              const isPast = currentStep > s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-xs font-semibold transition-all ${
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
                        ? "text-brand bg-white"
                        : isPast
                          ? "bg-emerald-500 text-white"
                          : "border-border text-muted border"
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
          <div className="border-border bg-surface space-y-6 rounded-3xl border p-6 shadow-sm sm:p-8">
            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
                    {t("stepContactTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepContactDesc")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-foreground/80 text-xs font-bold">
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => updateName(e.target.value, lastName)}
                      placeholder="Elsa"
                      className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground/80 text-xs font-bold">
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => updateName(firstName, e.target.value)}
                      placeholder="Manet"
                      className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground/80 text-xs font-bold">
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
                    className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-foreground/80 text-xs font-bold">
                      Email
                    </label>
                    <input
                      type="email"
                      value={data.contact.email ?? ""}
                      onChange={(e) => updateContact({ email: e.target.value })}
                      placeholder="elsa.manet@gmail.com"
                      className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground/80 text-xs font-bold">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={data.contact.phone ?? ""}
                      onChange={(e) => updateContact({ phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                      className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-foreground/80 text-xs font-bold">
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
                    className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                  />
                </div>

                {/* Profile Photo URL or Upload + Cropper */}
                <div className="border-border/40 space-y-1.5 border-t pt-2">
                  <label className="text-foreground/80 text-xs font-bold">
                    {t("photoOptional")}
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
                    <div className="border-border bg-muted/30 text-muted flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold">
                      {data.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={data.photo}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        firstName[0] || "?"
                      )}
                    </div>
                    <label className="border-brand/40 bg-brand/5 text-brand hover:bg-brand/10 shrink-0 cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-colors">
                      {"📷 Rasm yuklash"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileSelect}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={data.photo ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...draft,
                          data: { ...data, photo: e.target.value },
                        })
                      }
                      placeholder={t("photoUrlPlaceholder")}
                      className="border-border bg-surface focus:ring-brand/40 min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2"
                    />
                    {data.photo && (
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...draft,
                            data: { ...data, photo: "" },
                          })
                        }
                        className="border-border text-muted rounded-lg border px-2.5 py-2 text-xs hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Social Networks & Links (Optional) */}
                <div className="border-border/40 space-y-3 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-bold">
                      {t("socialLinksTitle")}
                    </label>
                    <span className="text-muted text-[11px]">
                      {"(Ixtiyoriy)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      type="text"
                      value={data.contact.telegram ?? ""}
                      onChange={(e) =>
                        updateContact({ telegram: e.target.value })
                      }
                      placeholder="Telegram: @username"
                      className="border-border bg-surface focus:ring-brand/40 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                    <input
                      type="text"
                      value={data.contact.github ?? ""}
                      onChange={(e) =>
                        updateContact({ github: e.target.value })
                      }
                      placeholder="GitHub: username"
                      className="border-border bg-surface focus:ring-brand/40 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                    <input
                      type="text"
                      value={data.contact.linkedin ?? ""}
                      onChange={(e) =>
                        updateContact({ linkedin: e.target.value })
                      }
                      placeholder="LinkedIn: in/username"
                      className="border-border bg-surface focus:ring-brand/40 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                    <input
                      type="text"
                      value={data.contact.website ?? ""}
                      onChange={(e) =>
                        updateContact({ website: e.target.value })
                      }
                      placeholder="Portfolio / Veb-sayt"
                      className="border-border bg-surface focus:ring-brand/40 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Work Experience */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
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
                      className="border-border bg-surface space-y-3 rounded-2xl border p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {item.position ||
                            item.organization ||
                            `#${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.experience.filter(
                              (_, i) => i !== index,
                            );
                            onChange({
                              ...draft,
                              data: { ...data, experience: updated },
                            });
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
                            updated[index] = {
                              ...item,
                              organization: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, experience: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.position ?? ""}
                          placeholder="Lavozim"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = {
                              ...item,
                              position: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, experience: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.startDate ?? ""}
                          placeholder="Boshlangan sana (masalan, 2022)"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = {
                              ...item,
                              startDate: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, experience: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.endDate ?? ""}
                          placeholder="Tugagan sana / Hozirgacha"
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[index] = {
                              ...item,
                              endDate: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, experience: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={item.description ?? ""}
                        placeholder="Vazifalar va yutuqlar..."
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[index] = {
                            ...item,
                            description: e.target.value,
                          };
                          onChange({
                            ...draft,
                            data: { ...data, experience: updated },
                          });
                        }}
                        className="border-border bg-surface w-full rounded-lg border p-2 text-xs outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [
                        ...data.experience,
                        {
                          organization: "",
                          position: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        },
                      ];
                      onChange({
                        ...draft,
                        data: { ...data, experience: updated },
                      });
                    }}
                    className="border-brand/60 bg-brand/5 text-brand hover:bg-brand/10 w-full rounded-xl border border-dashed py-3 text-xs font-bold transition-colors"
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
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
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
                      className="border-border bg-surface space-y-3 rounded-2xl border p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {item.institution || `#${index + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = data.education.filter(
                              (_, i) => i !== index,
                            );
                            onChange({
                              ...draft,
                              data: { ...data, education: updated },
                            });
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
                          updated[index] = {
                            ...item,
                            institution: e.target.value,
                          };
                          onChange({
                            ...draft,
                            data: { ...data, education: updated },
                          });
                        }}
                        className="border-border bg-surface w-full rounded-lg border px-3 py-1.5 text-xs outline-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.degree ?? ""}
                          placeholder="Daraja (masalan, Bakalavr)"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = {
                              ...item,
                              degree: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, education: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.field ?? ""}
                          placeholder="Yo'nalish (masalan, Kompyuter ilmlari)"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = { ...item, field: e.target.value };
                            onChange({
                              ...draft,
                              data: { ...data, education: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.startYear ?? ""}
                          placeholder="Boshlangan yili"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = {
                              ...item,
                              startYear: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, education: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={item.endYear ?? ""}
                          placeholder="Tugash yili"
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[index] = {
                              ...item,
                              endYear: e.target.value,
                            };
                            onChange({
                              ...draft,
                              data: { ...data, education: updated },
                            });
                          }}
                          className="border-border bg-surface rounded-lg border px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const updated = [
                        ...data.education,
                        {
                          institution: "",
                          degree: "",
                          field: "",
                          startYear: "",
                          endYear: "",
                        },
                      ];
                      onChange({
                        ...draft,
                        data: { ...data, education: updated },
                      });
                    }}
                    className="border-brand/60 bg-brand/5 text-brand hover:bg-brand/10 w-full rounded-xl border border-dashed py-3 text-xs font-bold transition-colors"
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
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
                    {t("stepSkillsTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepSkillsDesc")}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-foreground text-xs font-bold">
                    {tCv("fields.skills")}
                  </label>
                  <textarea
                    rows={3}
                    value={draft.skillsText}
                    onChange={(e) =>
                      onChange({ ...draft, skillsText: e.target.value })
                    }
                    placeholder="JavaScript, React, Figma, Python..."
                    className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2"
                  />

                  {/* Makemycv Suggestion Chips */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-xs font-semibold">
                          {draft.title && draft.title.trim().length > 1
                            ? t("skillsFor", { title: draft.title })
                            : t("suggestedSkills")}
                        </span>
                        {draft.title && draft.title.trim().length > 1 ? (
                          <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-bold">
                            {draft.title}
                          </span>
                        ) : null}
                      </div>

                      {draft.title && draft.title.trim().length > 1 ? (
                        <button
                          type="button"
                          disabled={loadingAiSkills}
                          onClick={handleFetchAiSkills}
                          className="border-brand/40 bg-brand/5 text-brand hover:bg-brand/10 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-60"
                        >
                          {loadingAiSkills
                            ? t("aiSkillsLoading")
                            : t("aiSkillsBtn")}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkillChip(skill)}
                          className="border-border bg-surface text-foreground hover:border-brand hover:text-brand rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                        >
                          {`+ ${skill}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Tillar (Languages) — Interactive List & Selector */}
                <div className="border-border/40 space-y-3.5 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-bold">
                      {t("languagesTitle")}
                    </label>
                    <span className="text-muted text-[11px]">
                      {data.languages.length} ta qoʻshildi
                    </span>
                  </div>

                  {/* Selected Languages List with Level Selector */}
                  <div className="space-y-2">
                    {data.languages.length === 0 ? (
                      <p className="text-muted bg-muted/10 border-border/60 rounded-xl border border-dashed p-3 text-xs italic">
                        {t("noLanguagesYet")}
                      </p>
                    ) : (
                      data.languages.map((lang, idx) => (
                        <div
                          key={idx}
                          className="border-border bg-surface flex items-center justify-between gap-3 rounded-xl border p-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-brand/10 text-brand flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                              🌐
                            </span>
                            <span className="text-foreground text-xs font-bold">
                              {lang.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={lang.level ?? "B2 - O'rta-yuqori"}
                              onChange={(e) =>
                                updateLanguageLevel(idx, e.target.value)
                              }
                              className="border-border bg-surface focus:ring-brand text-foreground cursor-pointer rounded-lg border px-2 py-1 text-xs font-medium outline-none focus:ring-1"
                            >
                              {LANGUAGE_LEVEL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => removeLanguage(idx)}
                              className="text-muted flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500"
                              title={t("deleteEntry")}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Add Language Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-muted text-[11px] font-semibold">
                      {t("suggestedLanguages")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_LANGUAGES.map((langName) => {
                        const isSelected = data.languages.some(
                          (l) =>
                            l.name.toLowerCase() === langName.toLowerCase(),
                        );
                        return (
                          <button
                            key={langName}
                            type="button"
                            onClick={() => toggleLanguage(langName)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-brand text-brand-foreground shadow-2xs"
                                : "border-border bg-surface text-foreground hover:border-brand hover:text-brand border"
                            }`}
                          >
                            {isSelected ? `✓ ${langName}` : `+ ${langName}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Language Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customLangInput}
                      onChange={(e) => setCustomLangInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomLanguage();
                        }
                      }}
                      placeholder={t("customLanguagePlaceholder")}
                      className="border-border bg-surface focus:ring-brand/40 flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLanguage}
                      className="border-border text-foreground hover:bg-muted/30 rounded-xl border px-3 py-1.5 text-xs font-bold"
                    >
                      {t("addLanguageBtn")}
                    </button>
                  </div>
                </div>

                {/* 3. Loyihalar (Projects) */}
                <div className="border-border/40 space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-bold">
                      {t("projectsTitle")}
                    </label>
                    <button
                      type="button"
                      onClick={addProject}
                      className="text-brand text-xs font-bold hover:underline"
                    >
                      {t("addProject")}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projectsList.map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        className="border-border bg-surface space-y-2.5 rounded-2xl border p-3.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {proj.name || `#${pIdx + 1} ${t("projectsTitle")}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeProject(pIdx)}
                            className="text-[11px] text-red-500 hover:underline"
                          >
                            {t("deleteEntry")}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={proj.name}
                              placeholder={t("projectName")}
                              onChange={(e) =>
                                updateProject(pIdx, { name: e.target.value })
                              }
                              className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={proj.year ?? ""}
                              placeholder={t("projectYear")}
                              onChange={(e) =>
                                updateProject(pIdx, { year: e.target.value })
                              }
                              className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={proj.link ?? ""}
                          placeholder={t("projectLink")}
                          onChange={(e) =>
                            updateProject(pIdx, { link: e.target.value })
                          }
                          className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                        />

                        <textarea
                          rows={2}
                          value={proj.description ?? ""}
                          placeholder={t("projectDesc")}
                          onChange={(e) =>
                            updateProject(pIdx, { description: e.target.value })
                          }
                          className="border-border bg-surface w-full rounded-lg border p-2 text-xs outline-none"
                        />
                      </div>
                    ))}

                    {projectsList.length === 0 && (
                      <button
                        type="button"
                        onClick={addProject}
                        className="border-border text-muted hover:border-brand hover:text-brand w-full rounded-xl border border-dashed py-2.5 text-xs transition-colors"
                      >
                        {t("addProject")}
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Sertifikatlar (Certificates) */}
                <div className="border-border/40 space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-bold">
                      {t("certificatesTitle")}
                    </label>
                    <button
                      type="button"
                      onClick={addCertificate}
                      className="text-brand text-xs font-bold hover:underline"
                    >
                      {t("addCertificate")}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {certsList.map((cert, cIdx) => (
                      <div
                        key={cIdx}
                        className="border-border bg-surface space-y-2 rounded-xl border p-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {cert.name ||
                              `#${cIdx + 1} ${t("certificatesTitle")}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCertificate(cIdx)}
                            className="text-[11px] text-red-500 hover:underline"
                          >
                            {t("deleteEntry")}
                          </button>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={cert.name}
                              placeholder={t("certName")}
                              onChange={(e) =>
                                updateCertificate(cIdx, {
                                  name: e.target.value,
                                })
                              }
                              className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={cert.issuer ?? ""}
                              placeholder={t("certIssuer")}
                              onChange={(e) =>
                                updateCertificate(cIdx, {
                                  issuer: e.target.value,
                                })
                              }
                              className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={cert.year ?? ""}
                              placeholder={t("certYear")}
                              onChange={(e) =>
                                updateCertificate(cIdx, {
                                  year: e.target.value,
                                })
                              }
                              className="border-border bg-surface w-full rounded-lg border px-2.5 py-1 text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {certsList.length === 0 && (
                      <button
                        type="button"
                        onClick={addCertificate}
                        className="border-border text-muted hover:border-brand hover:text-brand w-full rounded-xl border border-dashed py-2.5 text-xs transition-colors"
                      >
                        {t("addCertificate")}
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Qiziqishlar (Hobbies) */}
                <div className="border-border/40 space-y-3 border-t pt-4">
                  <label className="text-foreground text-xs font-bold">
                    {t("hobbiesTitle")}
                  </label>

                  {/* Selected Hobbies */}
                  {hobbiesList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {hobbiesList.map((h) => (
                        <span
                          key={h}
                          className="bg-brand/10 text-brand inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                        >
                          {h}
                          <button
                            type="button"
                            onClick={() => toggleHobby(h)}
                            className="hover:text-red-500"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Suggestion Hobbies */}
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_HOBBIES.map((h) => {
                      const active = hobbiesList.some(
                        (item) => item.toLowerCase() === h.toLowerCase(),
                      );
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHobby(h)}
                          className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                            active
                              ? "bg-brand text-brand-foreground"
                              : "border-border bg-surface text-foreground hover:border-brand border"
                          }`}
                        >
                          {active ? `✓ ${h}` : `+ ${h}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hobby Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customHobbyInput}
                      onChange={(e) => setCustomHobbyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomHobby();
                        }
                      }}
                      placeholder={t("hobbyPlaceholder")}
                      className="border-border bg-surface focus:ring-brand/40 flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomHobby}
                      className="border-border text-foreground hover:bg-muted/30 rounded-xl border px-3 py-1.5 text-xs font-bold"
                    >
                      {t("addHobby")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Summary & AI Generator */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
                    {t("stepSummaryTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepSummaryDesc")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-xs font-bold">
                      {tCv("fields.goal")}
                    </label>

                    {/* AI About Me Generator */}
                    <button
                      type="button"
                      onClick={handleGenerateAboutMe}
                      disabled={generatingAboutMe}
                      className="bg-brand/10 text-brand hover:bg-brand/20 flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {generatingAboutMe
                        ? t("aiGenerating")
                        : t("aiGenerateBtn")}
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={data.goal ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...draft,
                        data: { ...data, goal: e.target.value },
                      })
                    }
                    placeholder="Men IT va dasturlash sohasiga qiziquvchi, o'rganishga intiluvchan mutaxassisman..."
                    className="border-border bg-surface focus:ring-brand/40 w-full rounded-xl border p-3.5 text-sm leading-relaxed outline-none focus:ring-2"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Finalize & Template Selection */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-foreground text-2xl font-black tracking-tight">
                    {t("stepFinalizeTitle")}
                  </h2>
                  <p className="text-muted mt-1 text-xs">
                    {t("stepFinalizeDesc")}
                  </p>
                </div>

                {/* 15 Templates Selector: 3 Categories × 5 Templates */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-foreground text-xs font-bold">
                        {tCv("templates.title")}
                      </label>
                      <p className="text-muted text-[11px]">
                        {CV_TEMPLATE_NAMES[activeTemplateId] ??
                          activeTemplateId}{" "}
                        · {selectedCategory.toUpperCase()}
                      </p>
                    </div>
                    <span className="bg-brand/10 text-brand rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                      {CV_TEMPLATE_NAMES[activeTemplateId] || activeTemplateId}
                    </span>
                  </div>

                  {/* Category Tabs: Modern, Classic, Minimal */}
                  <div className="bg-muted/20 border-border/60 flex rounded-xl border p-1">
                    {CV_TEMPLATE_CATEGORIES.map((cat) => {
                      const isCatActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            if (!activeTemplateId.startsWith(cat.id + "-")) {
                              onChange({
                                ...draft,
                                templateId: `${cat.id}-1` as CvTemplateId,
                              });
                            }
                          }}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                            isCatActive
                              ? "bg-surface text-foreground border-border/80 border shadow-xs"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                          <span className="text-[10px] opacity-60">(5)</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 5 Templates Grid for the Selected Category */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                    {listTemplates(selectedCategory).map((tpl) => {
                      const isSelected = activeTemplateId === tpl.id;
                      const langKey =
                        (draft.language as "kk" | "uz" | "ru" | "en") || "uz";
                      const desc =
                        CV_TEMPLATE_DESCRIPTIONS[tpl.id]?.[langKey] ||
                        CV_TEMPLATE_DESCRIPTIONS[tpl.id]?.uz ||
                        "";
                      const catColor =
                        selectedCategory === "modern"
                          ? "#F97316"
                          : selectedCategory === "classic"
                            ? "#1E3A8A"
                            : "#27272A";

                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...draft,
                              templateId: tpl.id as CvTemplateId,
                            })
                          }
                          className={`group relative flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition-all ${
                            isSelected
                              ? "border-brand bg-brand/5 ring-brand/30 shadow-md ring-2"
                              : "border-border bg-surface hover:border-brand/40"
                          }`}
                        >
                          {isSelected ? (
                            <div className="bg-brand text-brand-foreground absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold shadow">
                              {tCv("templates.selectedBadge")}
                            </div>
                          ) : null}

                          {/* Mini visual thumbnail */}
                          <div className="border-border/80 bg-surface mb-2.5 flex h-20 w-full flex-col overflow-hidden rounded-xl border shadow-xs">
                            <TemplateThumbnail id={tpl.id} />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2 w-2 rounded-full shadow-xs"
                                style={{ backgroundColor: catColor }}
                              />
                              <span className="text-foreground text-xs font-bold">
                                {tpl.name}
                              </span>
                            </div>
                            <p className="text-muted mt-0.5 line-clamp-2 text-[10.5px] leading-tight">
                              {desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photo prompt when a photo template is selected */}
                {isPhotoTemplate(activeTemplateId) && (
                  <div className="border-brand/30 bg-brand/5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5">
                    <div className="space-y-0.5">
                      <p className="text-foreground text-xs font-bold">
                        {data.photo
                          ? "📷 Profilingiz rasmi shablonga biriktirildi"
                          : "📷 Ushbu shablon uchun rasm qo'shing"}
                      </p>
                      <p className="text-muted text-[11px]">
                        {
                          "Telegram / Instagram kabi rasmni surib va kattalashtirib moslashingiz mumkin."
                        }
                      </p>
                    </div>
                    <label className="bg-brand text-brand-foreground shrink-0 cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs hover:opacity-90">
                      {data.photo ? "Rasmni almashtirish" : "Rasm yuklash"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Conditional Obyektivka (Maǵlıwmatnama) fields & Relatives Table */}
                {activeTemplateId === "obyektivka" && (
                  <div className="border-border bg-muted/15 space-y-4 rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-foreground text-sm font-bold">
                          {"Maǵlıwmatnama (Obyektivka) qo'shimcha ma'lumotlari"}
                        </h4>
                        <p className="text-muted text-[11px]">
                          {
                            "Faqat Obyektivka shabloni tanlanganda to'ldiriladi."
                          }
                        </p>
                      </div>
                      <a
                        href="/api/cv/me/docx"
                        download="obyektivka.docx"
                        className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        {"📄 Word (.docx) yuklash"}
                      </a>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="text"
                        value={data.obyektivka?.lavozim ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ lavozim: e.target.value })
                        }
                        placeholder="Lavozim / Házirgi jumısı"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.tugilganSana ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ tugilganSana: e.target.value })
                        }
                        placeholder="Tuwılǵan jılı (masalan: 15.05.2001)"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.tugilganJoy ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ tugilganJoy: e.target.value })
                        }
                        placeholder="Tuwılǵan jeri"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.millati ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ millati: e.target.value })
                        }
                        placeholder="Milleti"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.partiya ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ partiya: e.target.value })
                        }
                        placeholder="Partiyalılıǵı (masalan: joq)"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.oqiganJoyi ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ oqiganJoyi: e.target.value })
                        }
                        placeholder="Tamamlaǵan oqıw ornı hám jılı"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.mutaxassislik ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ mutaxassislik: e.target.value })
                        }
                        placeholder="Bilimlendiriw boyınsha qánigeligi"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.ilmiyDaraja ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ ilmiyDaraja: e.target.value })
                        }
                        placeholder="Ilimiy dárejesi"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.ilmiyUnvon ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ ilmiyUnvon: e.target.value })
                        }
                        placeholder="Ilimiy ataǵı"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.harbiyUnvon ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ harbiyUnvon: e.target.value })
                        }
                        placeholder="Áskeriy (arnawlı) dárejesi"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.uyTelefoni ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ uyTelefoni: e.target.value })
                        }
                        placeholder="Uy telefonı"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.mukofotlar ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ mukofotlar: e.target.value })
                        }
                        placeholder="Mámleketlik sıylıqlar menen sıylıqlanǵan ba"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={data.obyektivka?.deputatlik ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ deputatlik: e.target.value })
                        }
                        placeholder="Xalıq deputatları yamasa saylanatuǵın organ aǵzası"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none sm:col-span-2"
                      />
                      <textarea
                        rows={3}
                        value={data.obyektivka?.mehnatFaoliyati ?? ""}
                        onChange={(e) =>
                          updateObyektivka({ mehnatFaoliyati: e.target.value })
                        }
                        placeholder="Miynet iskerligi (har qatorda jıllar hám jumıs ornı)"
                        className="border-border bg-surface rounded-xl border px-3 py-2 text-xs outline-none sm:col-span-2"
                      />
                    </div>

                    {/* Relatives Table */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground text-xs font-bold">
                          {"Jaqın tuwısqanları haqqında maǵlıwmat"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateObyektivka({
                              qarindoshlar: [
                                ...(data.obyektivka?.qarindoshlar ?? []),
                                {
                                  qarindoshligi: "",
                                  fio: "",
                                  tugilgan: "",
                                  ish: "",
                                  manzil: "",
                                },
                              ],
                            })
                          }
                          className="text-brand text-xs font-bold hover:underline"
                        >
                          {"+ Qator qo'shish"}
                        </button>
                      </div>
                      {(data.obyektivka?.qarindoshlar ?? []).map((rel, idx) => (
                        <div
                          key={idx}
                          className="border-border bg-surface space-y-2 rounded-xl border p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-muted text-[11px] font-bold">
                              {`#${idx + 1} Tuwısqan`}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list.splice(idx, 1);
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              className="text-xs text-red-500 hover:underline"
                            >
                              {"O'chirish"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              type="text"
                              value={rel.qarindoshligi}
                              onChange={(e) => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list[idx] = {
                                  ...list[idx],
                                  qarindoshligi: e.target.value,
                                };
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              placeholder="Tuwısqanlıq (Ákesi, Anası...)"
                              className="border-border rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={rel.fio}
                              onChange={(e) => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list[idx] = {
                                  ...list[idx],
                                  fio: e.target.value,
                                };
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              placeholder="Familiyası, atı hám ákesiniń atı"
                              className="border-border rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={rel.tugilgan}
                              onChange={(e) => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list[idx] = {
                                  ...list[idx],
                                  tugilgan: e.target.value,
                                };
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              placeholder="Tuwılǵan jılı hám ornı"
                              className="border-border rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={rel.ish}
                              onChange={(e) => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list[idx] = {
                                  ...list[idx],
                                  ish: e.target.value,
                                };
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              placeholder="Jumıs ornı hám lawazımı"
                              className="border-border rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={rel.manzil}
                              onChange={(e) => {
                                const list = [
                                  ...(data.obyektivka?.qarindoshlar ?? []),
                                ];
                                list[idx] = {
                                  ...list[idx],
                                  manzil: e.target.value,
                                };
                                updateObyektivka({ qarindoshlar: list });
                              }}
                              placeholder="Turar jayı"
                              className="border-border rounded-lg border px-2.5 py-1.5 text-xs outline-none sm:col-span-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                <div className="border-border/40 space-y-3 border-t pt-3">
                  <label className="text-foreground text-xs font-bold">
                    {tCv("privacy.title")}
                  </label>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    {[
                      { key: "hidePhone", label: tCv("privacy.hidePhone") },
                      { key: "hideEmail", label: tCv("privacy.hideEmail") },
                      { key: "hidePhoto", label: tCv("privacy.hidePhoto") },
                      { key: "hideAddress", label: tCv("privacy.hideAddress") },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="border-border bg-surface hover:border-brand/40 flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(
                            draft.privacy?.[
                              item.key as keyof typeof draft.privacy
                            ],
                          )}
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
                        <span className="text-muted font-medium">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div className="border-border bg-surface flex items-center justify-between rounded-2xl border p-4">
                  <span className="text-xs font-bold">
                    {tCv("visibility.label")}
                  </span>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => onToggleVisibility(e.target.checked)}
                    className="text-brand focus:ring-brand h-5 w-5 rounded"
                  />
                </div>

                {/* Mobile-only Final Scaled Preview (shown at the end on phones, desktop keeps right column) */}
                <div className="border-border bg-muted/20 space-y-2 rounded-2xl border p-3 lg:hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-bold uppercase">
                      {t("livePreview")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFullscreenOpen(true)}
                      className="text-brand text-xs font-bold hover:underline"
                    >
                      {"⛶ Kattalashtirish"}
                    </button>
                  </div>
                  <div className="border-border bg-surface w-full overflow-hidden rounded-xl border">
                    <div
                      className="flex justify-center"
                      style={{ height: "475px" }}
                    >
                      <div
                        style={{
                          width: "794px",
                          minWidth: "794px",
                          transform: "scale(0.41)",
                          transformOrigin: "top center",
                        }}
                      >
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
            )}

            {/* Bottom Form Navigation Buttons */}
            <div className="border-border/60 flex items-center justify-between gap-2 border-t pt-4">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="border-border text-muted hover:text-foreground rounded-xl border px-5 py-2.5 text-xs font-bold disabled:opacity-30"
              >
                {t("prev")}
              </button>

              {/* Mobile Preview Trigger */}
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                className="border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 rounded-xl border px-3 py-2 text-xs font-bold transition-colors lg:hidden"
              >
                ⛶ {t("fullscreenPreview")}
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) => Math.min(6, prev + 1))
                  }
                  className="bg-brand text-brand-foreground rounded-xl px-6 py-2.5 text-xs font-bold shadow hover:opacity-95"
                >
                  {t("next")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSave}
                  className="bg-brand text-brand-foreground rounded-xl px-7 py-2.5 text-xs font-black shadow hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? tCv("save") : t("finish")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Document Paper Preview (5 cols on desktop) */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="border-border bg-muted/20 sticky top-20 rounded-3xl border p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-muted text-xs font-bold tracking-wider uppercase">
                  {t("livePreview")}
                </span>
                <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {CV_TEMPLATE_NAMES[activeTemplateId] || draft.templateId}
                </span>
              </div>

              {/* Zoom & Fullscreen Controls */}
              <div className="flex items-center gap-1">
                {[0.5, 0.6, 0.75].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setZoomScale(scale)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors ${
                      zoomScale === scale
                        ? "bg-brand text-brand-foreground"
                        : "bg-surface border-border text-muted hover:text-foreground border"
                    }`}
                  >
                    {Math.round(scale * 100)}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFullscreenOpen(true)}
                  title={t("fullscreenPreview")}
                  className="bg-surface border-border text-foreground hover:bg-muted/40 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors"
                >
                  ⛶
                </button>
              </div>
            </div>

            {/* A4 Paper Scaled Wrapper (Centered, non-clipped) */}
            <div className="border-border bg-surface relative w-full overflow-hidden rounded-2xl border shadow-md">
              <div
                className="flex justify-center transition-transform duration-200"
                style={{
                  height: `${1123 * zoomScale + 32}px`,
                }}
              >
                <div
                  style={{
                    width: "794px",
                    minWidth: "794px",
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "top center",
                  }}
                  className="pt-2"
                >
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

      {/* Fullscreen Overlay Modal */}
      {fullscreenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setFullscreenOpen(false)}
        >
          <div className="mx-auto flex w-full max-w-[850px] items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {CV_TEMPLATE_NAMES[activeTemplateId] || draft.templateId}
              </span>
              <span className="bg-brand rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                100% A4
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenOpen(false)}
              className="rounded-xl bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
            >
              ✕ {t("close")}
            </button>
          </div>
          <div
            className="flex flex-1 items-start justify-center overflow-auto p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="my-auto rounded-sm bg-white shadow-2xl">
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
      )}

      {cropperSrc && (
        <PhotoCropperModal
          imageSrc={cropperSrc}
          aspect={activeTemplateId === "obyektivka" ? "portrait" : "square"}
          onCancel={() => setCropperSrc(null)}
          onConfirm={(croppedDataUrl) => {
            onChange({
              ...draft,
              data: { ...data, photo: croppedDataUrl },
            });
            setCropperSrc(null);
          }}
        />
      )}
    </div>
  );
}
