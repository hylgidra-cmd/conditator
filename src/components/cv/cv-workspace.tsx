"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert, useErrorText } from "@/components/ui/form";
import { requestJson } from "@/lib/client/api";
import type { CvData } from "@/lib/cv/schema";
import { formatDateTime } from "@/lib/format-date";
import { CvEditor } from "./cv-editor";
import { CvGenerator } from "./cv-generator";
import {
  type CvDraft,
  dataFromDraft,
  draftFromData,
  type SavedCvMeta,
} from "./types";

type SavedCvResponse = {
  cv: { savedAt: string | null; isVisible: boolean; data: CvData };
};

export function CvWorkspace({
  initialDraft,
  initialMeta,
}: {
  initialDraft: CvDraft;
  initialMeta: SavedCvMeta;
}) {
  const t = useTranslations("StudentCv");
  const errorText = useErrorText();
  const [draft, setDraft] = useState(initialDraft);
  const [meta, setMeta] = useState(initialMeta);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string>();

  function change(next: CvDraft) {
    setDraft(next);
    setDirty(true);
    setNotice(undefined);
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    setFieldErrors({});
    const result = await requestJson<SavedCvResponse>("PUT", "/api/cv/me", {
      language: draft.language,
      workTypes: draft.workTypes,
      sourceText: draft.sourceText || null,
      data: dataFromDraft(draft),
    });
    setSaving(false);
    if (!result.ok) {
      if (result.fields) {
        setFieldErrors(result.fields);
        setError("VALIDATION");
      } else setError(result.error);
      return;
    }
    setMeta({
      savedAt: result.data.cv.savedAt,
      isVisible: result.data.cv.isVisible,
    });
    setDraft(draftFromData(result.data.cv.data, draft));
    setDirty(false);
    setNotice(t("savedNotice"));
  }

  async function toggleVisibility(isVisible: boolean) {
    setError(undefined);
    const result = await requestJson<SavedCvResponse>(
      "PATCH",
      "/api/cv/me/visibility",
      { isVisible },
    );
    if (result.ok)
      setMeta((current) => ({
        ...current,
        isVisible: result.data.cv.isVisible,
      }));
    else setError(result.error);
  }

  return (
    <div className="space-y-6">
      <CvGenerator
        initialText={draft.sourceText}
        initialLanguage={draft.language}
        fullName={draft.data.fullName}
        phone={draft.data.contact.phone}
        dirty={dirty}
        onGenerated={({ cv, text, language }) => {
          change(
            draftFromData(cv, {
              language,
              workTypes: draft.workTypes,
              sourceText: text,
            }),
          );
        }}
      />

      <CvEditor
        draft={draft}
        errors={fieldErrors}
        errorText={errorText}
        onChange={change}
      />

      <div className="border-border bg-surface sticky bottom-0 space-y-3 rounded-2xl border p-4 shadow-lg">
        <FormAlert>{errorText(error)}</FormAlert>
        {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-sm">
            {dirty
              ? t("unsaved")
              : meta.savedAt
                ? t("saved", {
                    date: formatDateTime(meta.savedAt),
                  })
                : t("notSaved")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={meta.isVisible}
                disabled={!meta.savedAt}
                onChange={(event) => toggleVisibility(event.target.checked)}
              />
              <span>
                {!meta.savedAt
                  ? t("visibility.needSave")
                  : meta.isVisible
                    ? t("visibility.visible")
                    : t("visibility.hidden")}
              </span>
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-brand rounded-lg px-5 py-2 font-semibold text-white disabled:opacity-60"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
