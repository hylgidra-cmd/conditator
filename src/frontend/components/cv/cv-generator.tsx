"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { postJson } from "@/backend/client/api";
import { CV_TEXT_MAX, type CvData } from "@/backend/cv/schema";
import type { CvLanguage } from "./types";

const LANGUAGES: CvLanguage[] = ["en", "kk", "uz", "ru"];

type Props = {
  initialText: string;
  initialLanguage: CvLanguage;
  fullName: string | null;
  phone: string | null;
  /** true bo'lsa, qo'lda kiritilgan maydonlar almashtirilishidan oldin so'raladi. */
  confirmReplace: boolean;
  onGenerated: (result: {
    cv: CvData;
    text: string;
    language: CvLanguage;
  }) => void;
};

export function CvGenerator(props: Props) {
  const t = useTranslations("StudentCv.generator");
  const tLang = useTranslations("LocaleSwitcher");
  const errorText = useErrorText();
  const [text, setText] = useState(props.initialText);
  const [language, setLanguage] = useState<CvLanguage>(props.initialLanguage);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const count = Array.from(text).length;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (props.confirmReplace && !window.confirm(t("replaceConfirm"))) return;
    setPending(true);
    setError(undefined);
    setDone(false);
    const result = await postJson<{ cv: CvData }>("/api/cv/generate", {
      text,
      language,
      // Ism va telefon AI ga yuborilmaydi: server ularni matndan olib tashlash uchun oladi.
      fullName: props.fullName ?? undefined,
      phone: props.phone ?? undefined,
    });
    setPending(false);
    if (result.ok) {
      props.onGenerated({ cv: result.data.cv, text, language });
      setDone(true);
    } else {
      setError(result.fields ? Object.values(result.fields)[0] : result.error);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-surface space-y-3 rounded-2xl border p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-muted text-sm">{t("hint")}</p>
      <div>
        <label htmlFor="cv-text" className="block text-sm font-medium">
          {t("textLabel")}
        </label>
        <textarea
          id="cv-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          readOnly={pending}
          aria-describedby="cv-text-counter"
          rows={8}
          className="border-border focus:border-brand focus:ring-brand-soft mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
        />
        <p
          id="cv-text-counter"
          aria-live="polite"
          className={`text-right text-xs ${count > CV_TEXT_MAX ? "text-red-600" : "text-muted"}`}
        >
          {t("counter", { count, max: CV_TEXT_MAX })}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cv-language" className="block text-sm font-medium">
            {t("language")}
          </label>
          <select
            id="cv-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as CvLanguage)}
            className="border-border bg-surface mt-1 rounded-lg border px-3 py-2"
          >
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {tLang(code)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending || count === 0 || count > CV_TEXT_MAX}
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 font-semibold disabled:opacity-60"
        >
          {pending ? t("generating") : t("submit")}
        </button>
      </div>
      <FormAlert>{errorText(error)}</FormAlert>
      {done ? <FormAlert tone="success">{t("done")}</FormAlert> : null}
    </form>
  );
}
