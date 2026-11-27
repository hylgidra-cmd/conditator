"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { requestJson } from "@/backend/client/api";
import {
  VACANCY_CURRENCIES,
  VACANCY_TEXT_MAX,
  VACANCY_WORK_TYPES,
} from "@/backend/vacancy/schema";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { LocationPickerModal } from "./location-picker-modal";
import { VacancyPersonalityPicker } from "./vacancy-personality-picker";
import styles from "./vacancy-post.module.css";

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

const DRAFT_STORAGE_KEY = "candidator_vacancy_draft_v1";

const POPULAR_CITIES = [
  "Toshkent",
  "Nukus",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Urganch",
  "Qarshi",
  "Navoiy",
];

const parseSkillList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function formatNum(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function VacancyForm({
  initial,
  vacancyId,
  matchesHref,
  matchesLabel,
}: {
  initial: VacancyFormValues;
  /** Bo'lsa tahrirlash (PUT), bo'lmasa yangi talab (POST). */
  vacancyId?: string;
  matchesHref?: string;
  matchesLabel?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("Vacancies.form");
  const tStudio = useTranslations("VacancyPostStudio");
  const tWork = useTranslations("StudentCv.workTypes");
  const errorText = useErrorText();
  const router = useRouter();

  const [values, setValues] = useState<VacancyFormValues>(initial);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mapOpen, setMapOpen] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  async function handleApplySkillTemplate() {
    if (!values.professionId || applyingTemplate) return;
    setApplyingTemplate(true);
    setTemplateNotice(null);
    try {
      const res = await fetch(
        `/api/professions/${encodeURIComponent(values.professionId)}/skill-template?locale=${encodeURIComponent(locale)}`,
      );
      if (!res.ok) {
        setTemplateNotice("Shablon ko'nikmalarini yuklab bo'lmadi.");
        return;
      }
      const data = (await res.json()) as {
        skills?: Array<{ name: string }>;
      };
      if (data.skills && data.skills.length > 0) {
        const existing = parseSkillList(values.skills);
        const normSet = new Set(existing.map((s) => s.toLowerCase()));
        const merged = [...existing];
        let addedCount = 0;
        for (const sk of data.skills) {
          if (!normSet.has(sk.name.toLowerCase())) {
            normSet.add(sk.name.toLowerCase());
            merged.push(sk.name);
            addedCount += 1;
          }
        }
        setValues((curr) => ({ ...curr, skills: merged.join(", ") }));
        setTemplateNotice(
          addedCount > 0
            ? `${addedCount} ta ko'nikma qo'shildi`
            : "Barcha 6 ta ko'nikma allaqachon qo'shilgan",
        );
      }
    } catch {
      setTemplateNotice("Shablon ko'nikmalarini yuklab bo'lmadi.");
    } finally {
      setApplyingTemplate(false);
    }
  }

  // Restore saved draft for brand-new blank vacancy
  useEffect(() => {
    if (vacancyId || initial.title || initial.rawText) return;
    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<VacancyFormValues>;
        if (parsed && typeof parsed === "object") {
          setValues((curr) => ({ ...curr, ...parsed }));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [vacancyId, initial.title, initial.rawText]);

  const skillsList = useMemo(
    () => parseSkillList(values.skills),
    [values.skills],
  );
  const charCount = Array.from(values.rawText).length;

  const setField =
    (key: keyof VacancyFormValues) =>
    (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  function handleAddSkill() {
    const clean = skillDraft.trim();
    if (!clean) return;
    const exists = skillsList.some(
      (s) => s.toLowerCase() === clean.toLowerCase(),
    );
    if (!exists) {
      const next = [...skillsList, clean].join(", ");
      setValues((curr) => ({ ...curr, skills: next }));
    }
    setSkillDraft("");
    setAddingSkill(false);
  }

  function handleRemoveSkill(skillToRemove: string) {
    const next = skillsList.filter((s) => s !== skillToRemove).join(", ");
    setValues((curr) => ({ ...curr, skills: next }));
  }

  function handleSaveDraft() {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
      setDraftNotice(true);
      window.setTimeout(() => setDraftNotice(false), 2600);
    } catch {
      // Ignore storage quota errors
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || deleting) return;
    setPending(true);
    setError(undefined);
    setFields({});

    const years = values.minExperienceYears.trim();
    const salaryFromRaw = values.salaryFrom.trim();
    const salaryToRaw = values.salaryTo.trim();

    const body = {
      title: values.title || null,
      rawText: values.rawText || null,
      skills: skillsList,
      languages: parseSkillList(values.languages),
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
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      router.push("/company/vacancies");
      router.refresh();
      return;
    }

    setError(result.error);
    setFields(result.fields ?? {});
    if (result.fields?.title || result.fields?.rawText || result.fields?.location) {
      setStep(1);
    } else if (
      result.fields?.skills ||
      result.fields?.languages ||
      result.fields?.minExperienceYears ||
      result.fields?.status
    ) {
      setStep(2);
    }
  }

  async function onDelete() {
    if (!vacancyId || deleting || pending) return;
    if (!window.confirm(t("deleteConfirm"))) return;
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

  const salaryPreview = useMemo(() => {
    const unit =
      values.currency === "UZS" ? tStudio("currencySom") : values.currency;
    const fromFmt = formatNum(values.salaryFrom);
    const toFmt = formatNum(values.salaryTo);
    if (fromFmt && toFmt) return `${fromFmt} – ${toFmt} ${unit}`;
    if (fromFmt) return `${fromFmt}+ ${unit}`;
    if (toFmt) return `${toFmt} ${unit}`;
    return tStudio("salaryNegotiable");
  }, [values.salaryFrom, values.salaryTo, values.currency, tStudio]);

  const checkTitleDone = values.title.trim().length >= 2;
  const checkWorkTypeDone = Boolean(values.workType);
  const checkDescDone = values.rawText.trim().length >= 10;
  const checkSkillsDone = skillsList.length > 0;

  const stepsMeta: Array<{ num: 1 | 2 | 3; label: string }> = [
    { num: 1, label: tStudio("steps.about") },
    { num: 2, label: tStudio("steps.requirements") },
    { num: 3, label: tStudio("steps.review") },
  ];

  return (
    <div className={`${styles.stage} font-ui`}>
      <div className="mx-auto max-w-[1260px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-8">
        {/* ================= PAGE TITLE HEADER ================= */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-[1.14] font-extrabold tracking-tight text-[#0b2017] sm:text-[34px] dark:text-[#f4fbf8]">
              {vacancyId ? tStudio("pageEditTitle") : tStudio("pageTitle")}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-[#4a6a5d] dark:text-[#98c1b0]">
              {tStudio("pageSubtitle")}
            </p>
          </div>

          {matchesHref && matchesLabel ? (
            <Link
              href={matchesHref}
              className={`${styles.ctaBtn} h-10 px-4 text-xs`}
            >
              <span>{matchesLabel}</span>
              <span>→</span>
            </Link>
          ) : null}
        </div>

        {/* ================= EMERALD STUDIO BANNER (3D BRIEFCASE) ================= */}
        <section className={`${styles.bannerWrap} mt-5`}>
          <div aria-hidden className={styles.bannerArtwork} />
          <div className="relative z-10 flex min-h-[118px] items-center justify-between gap-4 px-6 py-5 sm:min-h-[132px] sm:px-8">
            <div className="max-w-md">
              <h2 className="text-lg font-extrabold tracking-tight text-[#0b2017] sm:text-xl dark:text-[#f4fbf8]">
                {vacancyId
                  ? tStudio("bannerEditTitle")
                  : tStudio("bannerTitle")}
              </h2>
              <p className="mt-1 text-xs font-medium text-[#3b5d4f] sm:text-sm dark:text-[#a6d0be]">
                {tStudio("bannerSubtitle")}
              </p>
            </div>

            <div
              aria-hidden
              className="hidden size-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/75 text-xl font-bold text-[#0b7e50] shadow-sm backdrop-blur-md sm:flex dark:border-[#34eab0]/35 dark:bg-[#082c1e]/80 dark:text-[#34eab0]"
            >
              +
            </div>
          </div>
        </section>

        {/* ================= 3-STEP HORIZONTAL PROGRESS STEPPER ================= */}
        <nav
          aria-label={tStudio("pageTitle")}
          className="mt-6 flex items-center justify-between gap-2 sm:gap-4"
        >
          {stepsMeta.map((item, idx) => {
            const isActive = step === item.num;
            const isDone = step > item.num;
            return (
              <div
                key={item.num}
                className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none"
              >
                <button
                  type="button"
                  onClick={() => setStep(item.num)}
                  className="group flex cursor-pointer items-center gap-2.5 text-left"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
                      isActive
                        ? "bg-[#0c8a58] text-white shadow-[0_4px_12px_rgba(12,138,88,0.35)] dark:bg-[#27eba0] dark:text-[#032216]"
                        : isDone
                          ? "bg-[#d6f4e5] text-[#09754b] dark:bg-[#104933] dark:text-[#34eab0]"
                          : "border border-[#c7dfd4] bg-white text-[#5d7c6f] group-hover:border-[#0e935f] dark:border-[#1e5c42] dark:bg-[#072016] dark:text-[#86b09e]"
                    }`}
                  >
                    {isDone ? "✓" : item.num}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      isActive
                        ? "font-extrabold text-[#0b2017] dark:text-[#f4fbf8]"
                        : "font-semibold text-[#5a796c] dark:text-[#8bb5a3]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                {idx < stepsMeta.length - 1 ? (
                  <div
                    className={`h-[1.5px] flex-1 rounded-full transition-colors ${
                      step > item.num
                        ? "bg-[#0e935f] dark:bg-[#27eba0]"
                        : "bg-[#d5e7de] dark:bg-[#174a35]"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* ================= 2-COLUMN WORKSPACE: FORM + LIVE PREVIEW ================= */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_356px] lg:items-start"
        >
          {/* ---------- LEFT FORM CARD ---------- */}
          <div className={`${styles.panel} p-5 sm:p-6`}>
            {step === 1 ? (
              <div className="space-y-5">
                {/* Vakansiya nomi */}
                <div>
                  <label
                    htmlFor="vac-title"
                    className="mb-1.5 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                  >
                    {tStudio("titleLabel")}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="vac-title"
                    type="text"
                    maxLength={120}
                    value={values.title}
                    onChange={setField("title")}
                    placeholder={tStudio("titlePlaceholder")}
                    className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                  />
                  {fields.title ? (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {errorText(fields.title)}
                    </p>
                  ) : null}
                </div>

                {/* Ish turi + Hudud */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vac-workType"
                      className="mb-1.5 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                    >
                      {tStudio("workTypeLabel")}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <svg
                        aria-hidden
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none absolute left-3.5 text-[#5b7a6d] dark:text-[#86b29f]"
                      >
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <select
                        id="vac-workType"
                        value={values.workType}
                        onChange={setField("workType")}
                        className="h-11 w-full cursor-pointer rounded-xl border border-[#cde6da] bg-[#f8fcfa] pr-3 pl-10 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                      >
                        <option value="">{tStudio("workTypeSelect")}</option>
                        {VACANCY_WORK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {tWork(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label
                        htmlFor="vac-location"
                        className="block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                      >
                        {tStudio("locationLabel")}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMapOpen(true)}
                        className="cursor-pointer text-[11px] font-bold text-[#0c8a58] hover:underline dark:text-[#34eab0]"
                      >
                        {t("map.pickOnMap")}
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <svg
                        aria-hidden
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none absolute left-3.5 text-[#5b7a6d] dark:text-[#86b29f]"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <input
                        id="vac-location"
                        type="text"
                        list="vac-cities-datalist"
                        maxLength={100}
                        value={values.location}
                        onChange={setField("location")}
                        placeholder={tStudio("locationPlaceholder")}
                        className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] pr-3 pl-10 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                      />
                      <datalist id="vac-cities-datalist">
                        {POPULAR_CITIES.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                    {fields.location ? (
                      <p className="mt-1 text-xs font-semibold text-rose-500">
                        {errorText(fields.location)}
                      </p>
                    ) : null}
                    <LocationPickerModal
                      open={mapOpen}
                      initialLocation={values.location}
                      onSelect={(address) =>
                        setValues((current) => ({
                          ...current,
                          location: address,
                        }))
                      }
                      onClose={() => setMapOpen(false)}
                    />
                  </div>
                </div>

                {/* Maosh (so'm) */}
                <div>
                  <label className="mb-1.5 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]">
                    {tStudio("salaryLabel")}
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                    <div className="relative flex items-center">
                      <svg
                        aria-hidden
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none absolute left-3 text-[#0c8a58] dark:text-[#34eab0]"
                      >
                        <rect width="20" height="12" x="2" y="6" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={values.salaryFrom}
                        onChange={setField("salaryFrom")}
                        placeholder={tStudio("salaryFromPlaceholder")}
                        className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] pr-3 pl-9 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                      />
                    </div>

                    <span className="text-sm font-bold text-[#6e8b7f]">–</span>

                    <div className="relative flex items-center">
                      <svg
                        aria-hidden
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none absolute left-3 text-[#0c8a58] dark:text-[#34eab0]"
                      >
                        <rect width="20" height="12" x="2" y="6" rx="2" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={values.salaryTo}
                        onChange={setField("salaryTo")}
                        placeholder={tStudio("salaryToPlaceholder")}
                        className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] pr-3 pl-9 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                      />
                    </div>

                    <select
                      aria-label={tStudio("currencyLabel")}
                      value={values.currency}
                      onChange={setField("currency")}
                      className="h-11 cursor-pointer rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3 text-xs font-extrabold outline-none focus:border-[#0e935f] dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white"
                    >
                      {VACANCY_CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vazifalar (Description) */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor="vac-rawText"
                      className="block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                    >
                      {tStudio("tasksLabel")}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-semibold ${
                        charCount > VACANCY_TEXT_MAX
                          ? "text-rose-500"
                          : "text-[#6a887b] dark:text-[#82ad9a]"
                      }`}
                    >
                      {t("counter", {
                        count: charCount,
                        max: VACANCY_TEXT_MAX,
                      })}
                    </span>
                  </div>
                  <textarea
                    id="vac-rawText"
                    rows={5}
                    value={values.rawText}
                    onChange={setField("rawText")}
                    placeholder={tStudio("tasksPlaceholder")}
                    className="w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] p-3.5 text-sm leading-relaxed outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                  />
                  {fields.rawText ? (
                    <p className="mt-1 text-xs font-semibold text-rose-500">
                      {errorText(fields.rawText)}
                    </p>
                  ) : null}
                </div>

                {/* Ko'nikmalar (Interactive Skill Chips) */}
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]">
                    {tStudio("skillsLabel")}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {skillsList.map((skill) => (
                      <span key={skill} className={styles.skillChip}>
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="cursor-pointer text-sm leading-none opacity-75 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {addingSkill ? (
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={skillDraft}
                          onChange={(e) => setSkillDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            } else if (e.key === "Escape") {
                              setAddingSkill(false);
                              setSkillDraft("");
                            }
                          }}
                          placeholder={tStudio("addSkillPlaceholder")}
                          className="h-8 w-36 rounded-lg border border-[#0e935f] bg-white px-2.5 text-xs font-medium outline-none dark:border-[#34eab0] dark:bg-[#082419] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="h-8 cursor-pointer rounded-lg bg-[#0c8a58] px-2.5 text-xs font-bold text-white dark:bg-[#27eba0] dark:text-[#032216]"
                        >
                          {tStudio("addSkillConfirm")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingSkill(true)}
                        className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-dashed border-[#a6d3be] bg-[#f6fcf9] px-3 text-xs font-bold text-[#355a4b] transition hover:border-[#0e935f] hover:text-[#0a7a4e] dark:border-[#22694c] dark:bg-[#072117] dark:text-[#9bc5b3] dark:hover:border-[#34eab0] dark:hover:text-[#34eab0]"
                      >
                        {tStudio("addSkillBtn")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vac-languages"
                      className="mb-1.5 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                    >
                      {tStudio("languagesLabel")}
                    </label>
                    <input
                      id="vac-languages"
                      type="text"
                      value={values.languages}
                      onChange={setField("languages")}
                      placeholder={tStudio("languagesPlaceholder")}
                      className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                    />
                    {fields.languages ? (
                      <p className="text-danger mt-1 text-xs font-semibold">
                        {errorText(fields.languages)}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="vac-minExp"
                      className="mb-1.5 block text-xs font-extrabold text-[#112a20] sm:text-[13px] dark:text-[#eaf8f1]"
                    >
                      {tStudio("experienceLabel")}
                    </label>
                    <input
                      id="vac-minExp"
                      type="number"
                      min={0}
                      max={50}
                      inputMode="numeric"
                      value={values.minExperienceYears}
                      onChange={setField("minExperienceYears")}
                      placeholder={tStudio("experiencePlaceholder")}
                      className="h-11 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3.5 text-sm font-medium outline-none transition focus:border-[#0e935f] focus:bg-white dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white dark:placeholder:text-[#78a391] dark:focus:border-[#34eab0] dark:focus:bg-[#09291d]"
                    />
                    {fields.minExperienceYears ? (
                      <p className="text-danger mt-1 text-xs font-semibold">
                        {errorText(fields.minExperienceYears)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Qanday odam kerak? (TZ 2 shaxsiyat talabi) */}
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

                {/* TZ 3: Tanlangan kasb bo'yicha 6 ta ko'nikma shablonini qo'llash */}
                {values.professionId ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#cde6da] bg-[#f4fbf7] px-4 py-3 dark:border-[#1c5940] dark:bg-[#072117]">
                    <div>
                      <p className="text-xs font-extrabold text-[#0b2017] dark:text-[#eefaf3]">
                        {"Kasb ko'nikmalari shabloni (6 ta)"}
                      </p>
                      <p className="text-[11px] text-[#4a6a5d] dark:text-[#98c1b0]">
                        {templateNotice ||
                          "Tanlangan kasb uchun eng kerakli 6 ko'nikmani avtomatik talablarga qo'shing."}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={applyingTemplate}
                      onClick={handleApplySkillTemplate}
                      className={`${styles.ctaBtn} h-9 cursor-pointer px-4 text-xs disabled:opacity-60`}
                    >
                      {applyingTemplate
                        ? "Yuklanmoqda..."
                        : "Shablonni qo'llash"}
                    </button>
                  </div>
                ) : null}

                {vacancyId ? (
                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#e4f1eb] pt-4 dark:border-[#154531]">
                    <div className="min-w-[220px] flex-1">
                      <label
                        htmlFor="vac-status"
                        className="mb-1.5 block text-xs font-extrabold text-[#112a20] dark:text-[#eaf8f1]"
                      >
                        {tStudio("statusLabel")}
                      </label>
                      <select
                        id="vac-status"
                        value={values.status}
                        onChange={setField("status")}
                        className="h-10 w-full rounded-xl border border-[#cde6da] bg-[#f8fcfa] px-3 text-xs font-bold outline-none dark:border-[#1d5e43] dark:bg-[#072016] dark:text-white"
                      >
                        <option value="ACTIVE">{tStudio("statusActive")}</option>
                        <option value="CLOSED">{tStudio("statusClosed")}</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={pending || deleting}
                      onClick={onDelete}
                      className="h-10 cursor-pointer rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
                    >
                      {deleting ? tStudio("deletingBtn") : tStudio("deleteBtn")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <p className="text-xs font-medium text-[#4a6a5d] dark:text-[#98c1b0]">
                  {tStudio("reviewIntro")}
                </p>

                <div className="space-y-3 rounded-2xl border border-[#dceee5] bg-[#f7fcfa] p-4 dark:border-[#19533b] dark:bg-[#072117]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                        {values.title || tStudio("previewEmptyTitle")}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-[#48685b] dark:text-[#9ec5b4]">
                        {[
                          values.location || tStudio("previewEmptyLocation"),
                          values.workType
                            ? tWork(
                                values.workType as (typeof VACANCY_WORK_TYPES)[number],
                              )
                            : tStudio("previewEmptyWorkType"),
                          salaryPreview,
                        ].join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="cursor-pointer text-xs font-bold text-[#0c8a58] hover:underline dark:text-[#34eab0]"
                    >
                      {tStudio("reviewEditBtn")}
                    </button>
                  </div>

                  {values.rawText ? (
                    <p className="whitespace-pre-line text-xs leading-relaxed text-[#2a4a3d] dark:text-[#c7ebd9]">
                      {values.rawText}
                    </p>
                  ) : null}

                  {skillsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillsList.map((sk) => (
                        <span key={sk} className={styles.skillChip}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {(values.languages.trim() ||
                    values.minExperienceYears.trim()) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dceee5] pt-3 text-xs text-[#4a6a5d] dark:border-[#19533b] dark:text-[#98c1b0]">
                      <div className="flex flex-wrap gap-3">
                        {values.languages.trim() ? (
                          <span>
                            {tStudio("languagesLabel")}: {values.languages}
                          </span>
                        ) : null}
                        {values.minExperienceYears.trim() ? (
                          <span>
                            {tStudio("experienceLabel")}:{" "}
                            {values.minExperienceYears}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="cursor-pointer text-xs font-bold text-[#0c8a58] hover:underline dark:text-[#34eab0]"
                      >
                        {tStudio("reviewEditBtn")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Error & Draft notice */}
            <div className="mt-4">
              <FormAlert>
                {errorText(error === "VALIDATION" ? undefined : error)}
              </FormAlert>
              {draftNotice ? (
                <p className="rounded-xl border border-[#0e935f]/25 bg-[#e6f8ef] px-3 py-2 text-xs font-bold text-[#09754b] dark:border-[#34eab0]/35 dark:bg-[#0d3b29] dark:text-[#3be7a3]">
                  ✓ {tStudio("draftSavedNotice")}
                </p>
              ) : null}
            </div>

            {/* Bottom Action Bar (Save Draft + Next / Publish) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4f1eb] pt-5 dark:border-[#154531]">
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : 1))}
                    className={`${styles.secondaryBtn} h-11 cursor-pointer px-4 text-xs sm:text-sm`}
                  >
                    ← {tStudio("prevStepBtn")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className={`${styles.secondaryBtn} h-11 cursor-pointer px-4 text-xs sm:text-sm`}
                >
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                  <span>{tStudio("saveDraftBtn")}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : 3))}
                    className={`${styles.secondaryBtn} h-11 cursor-pointer px-4 text-xs sm:text-sm`}
                  >
                    <span>{tStudio("nextStepBtn")}</span>
                    <span>→</span>
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={pending || deleting}
                  className={`${styles.ctaBtn} h-11 cursor-pointer px-6 text-xs sm:text-sm disabled:opacity-55`}
                >
                  <svg
                    aria-hidden
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                  <span>
                    {pending
                      ? tStudio("submittingBtn")
                      : vacancyId
                        ? tStudio("updateBtn")
                        : tStudio("publishBtn")}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ---------- RIGHT STICKY COLUMN: LIVE PREVIEW + CHECKLIST ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-22">
            {/* Card 1: Vakansiya ko'rinishi */}
            <div className={`${styles.panel} p-5`}>
              <div className="flex items-center gap-2 border-b border-[#e4f1eb] pb-3 dark:border-[#154531]">
                <svg
                  aria-hidden
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#0c8a58] dark:text-[#34eab0]"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <h2 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                  {tStudio("previewTitle")}
                </h2>
              </div>

              <div className="mt-4 space-y-2.5">
                <h3 className="text-base font-extrabold text-[#0b2017] dark:text-[#f4fbf8]">
                  {values.title.trim() || tStudio("previewEmptyTitle")}
                </h3>

                <div className="space-y-1.5 text-xs font-medium text-[#4a6a5d] dark:text-[#98c1b0]">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>
                      {values.location.trim() ||
                        tStudio("previewEmptyLocation")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>
                      {values.workType
                        ? tWork(
                            values.workType as (typeof VACANCY_WORK_TYPES)[number],
                          )
                        : tStudio("previewEmptyWorkType")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-bold text-[#0c241b] dark:text-[#e6f7ee]">
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-[#0c8a58] dark:text-[#34eab0]"
                    >
                      <rect width="20" height="12" x="2" y="6" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span>{salaryPreview}</span>
                  </div>
                </div>

                <p className="line-clamp-3 pt-1 text-xs leading-relaxed text-[#527265] dark:text-[#98c1b0]">
                  {values.rawText.trim() || tStudio("previewEmptyDesc")}
                </p>

                {skillsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skillsList.slice(0, 6).map((sk) => (
                      <span key={sk} className={styles.skillChip}>
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card 2: E'lon tekshiruvi (Live Checklist) */}
            <div className={`${styles.panel} p-5`}>
              <div className="flex items-center gap-2 border-b border-[#e4f1eb] pb-3 dark:border-[#154531]">
                <svg
                  aria-hidden
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#0c8a58] dark:text-[#34eab0]"
                >
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
                <h2 className="text-[15px] font-extrabold text-[#0d241b] dark:text-[#effaf4]">
                  {tStudio("checklistTitle")}
                </h2>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  {
                    ok: checkTitleDone,
                    title: tStudio("checkTitle"),
                    desc: checkTitleDone
                      ? tStudio("checkTitleOk")
                      : tStudio("checkTitlePending"),
                  },
                  {
                    ok: checkWorkTypeDone,
                    title: tStudio("checkWorkType"),
                    desc: checkWorkTypeDone
                      ? tStudio("checkWorkTypeOk")
                      : tStudio("checkWorkTypePending"),
                  },
                  {
                    ok: checkDescDone,
                    title: tStudio("checkDesc"),
                    desc: checkDescDone
                      ? tStudio("checkDescOk")
                      : tStudio("checkDescPending"),
                  },
                  {
                    ok: checkSkillsDone,
                    title: tStudio("checkSkills"),
                    desc: checkSkillsDone
                      ? tStudio("checkSkillsOk", { count: skillsList.length })
                      : tStudio("checkSkillsPending"),
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition ${
                        item.ok
                          ? "bg-[#0e935f] text-white dark:bg-[#27eba0] dark:text-[#032216]"
                          : "border border-[#c7dfd4] bg-[#f4fbf7] text-transparent dark:border-[#1e5c42] dark:bg-[#072016]"
                      }`}
                    >
                      ✓
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#0f291f] dark:text-[#ebf9f2]">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-medium text-[#5e7d70] dark:text-[#86b29f]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
