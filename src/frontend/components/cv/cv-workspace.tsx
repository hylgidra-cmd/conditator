"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { requestJson } from "@/backend/client/api";
import type { CvData } from "@/backend/cv/schema";
import { formatDateTime } from "@/backend/format-date";
import type {
  CvDocumentLabels,
  CvDocumentLanguage,
} from "@/backend/cv-document/types";
import { CvEditor } from "./cv-editor";
import { CvGenerator } from "./cv-generator";
import { CvStarterChoice } from "./cv-starter-choice";
import { CvImportScreen } from "./cv-import-screen";
import { CvSetupLoading } from "./cv-setup-loading";
import { CvStepBuilder } from "./cv-step-builder";
import {
  type CvDraft,
  dataFromDraft,
  draftFromData,
  type SavedCvMeta,
} from "./types";

type SavedCvResponse = {
  cv: { savedAt: string | null; isVisible: boolean; data: CvData };
};

type WorkspaceMode = "choice" | "import" | "loading" | "builder" | "classic";

export function CvWorkspace({
  initialDraft,
  initialMeta,
  labelsMap,
}: {
  initialDraft: CvDraft;
  initialMeta: SavedCvMeta;
  labelsMap: Record<CvDocumentLanguage, CvDocumentLabels>;
}) {
  const t = useTranslations("StudentCv");
  const errorText = useErrorText();
  const [draft, setDraft] = useState(initialDraft);
  const [meta, setMeta] = useState(initialMeta);
  const [dirty, setDirty] = useState(false);
  const [handEdited, setHandEdited] = useState(Boolean(initialMeta.savedAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string>();

  // Agar allaqachon saqlangan CV bo'lsa, builder ochiladi. Aks holda onboarding tanlash ekrani (1-rasm).
  const [mode, setMode] = useState<WorkspaceMode>(
    initialMeta.savedAt ? "builder" : "choice",
  );

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
      title: draft.title,
      templateId: draft.templateId,
      privacy: draft.privacy,
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
    if (result.ok) {
      setMeta((current) => ({
        ...current,
        isVisible: result.data.cv.isVisible,
      }));
    } else {
      setError(result.error);
    }
  }

  // 1-bosqich: Tanlash ekrani (Import yoki Noldan)
  if (mode === "choice") {
    return (
      <CvStarterChoice
        hasExistingCv={Boolean(meta.savedAt)}
        onSelectChoice={(choice) => {
          if (choice === "import") {
            setMode("import");
          } else {
            setMode("loading");
          }
        }}
        onEditExisting={() => setMode("builder")}
      />
    );
  }

  // 2-bosqich: Fayl yuklash (PDF / DOCX / TXT yoki matn joylash)
  if (mode === "import") {
    return (
      <CvImportScreen
        currentLanguage={draft.language}
        onBack={() => setMode("choice")}
        onImportSuccess={({ cv, text }) => {
          const personal = {
            fullName: draft.data.fullName,
            contact: {
              email: draft.data.contact.email,
              phone: draft.data.contact.phone,
            },
          };
          change(
            draftFromData(
              { ...cv, ...personal },
              {
                language: draft.language,
                workTypes: draft.workTypes,
                sourceText: text,
              },
            ),
          );
          setHandEdited(false);
          setMode("loading");
        }}
      />
    );
  }

  // 3-bosqich: Yuklanish / Sozlash animatsiyasi
  if (mode === "loading") {
    return <CvSetupLoading onDone={() => setMode("builder")} />;
  }

  // 4-bosqich: Yangi zamonaviy bosqichma-bosqich tuzuvchi (Step Builder + Live A4 preview)
  if (mode === "builder") {
    const currentLabels =
      labelsMap[draft.language as CvDocumentLanguage] ?? labelsMap.en;

    return (
      <div className="space-y-4">
        {/* Yuqori boshqaruv paneli: rejimni o'zgartirish va holat */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/80 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("choice")}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              {t("onboarding.restartWizard")}
            </button>
            <button
              type="button"
              onClick={() => setMode("classic")}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              {t("onboarding.switchFullEditor")}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {meta.savedAt && !dirty ? (
              <Link
                href="/student/cv/preview"
                className="text-brand text-xs font-bold underline-offset-2 hover:underline"
              >
                {t("previewLink")}
              </Link>
            ) : null}
            <span className="text-muted text-xs">
              {dirty
                ? t("unsaved")
                : meta.savedAt
                  ? t("saved", { date: formatDateTime(meta.savedAt) })
                  : t("notSaved")}
            </span>
          </div>
        </div>

        <FormAlert>{errorText(error)}</FormAlert>
        {notice ? <FormAlert tone="success">{notice}</FormAlert> : null}

        <CvStepBuilder
          draft={draft}
          labels={currentLabels}
          saving={saving}
          isVisible={meta.isVisible}
          onToggleVisibility={toggleVisibility}
          onChange={(next) => {
            setHandEdited(true);
            change(next);
          }}
          onSave={save}
          onRestart={() => setMode("choice")}
        />
      </div>
    );
  }

  // Standart to'liq muharrir (Classic view)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <span className="text-xs font-medium text-muted">
          {t("onboarding.switchFullEditor")}
        </span>
        <button
          type="button"
          onClick={() => setMode("builder")}
          className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-brand-foreground shadow hover:opacity-90 transition-opacity"
        >
          {t("onboarding.switchStepBuilder")}
        </button>
      </div>

      <CvGenerator
        initialText={draft.sourceText}
        initialLanguage={draft.language}
        fullName={draft.data.fullName}
        phone={draft.data.contact.phone}
        confirmReplace={handEdited}
        onGenerated={({ cv, text, language }) => {
          setHandEdited(false);
          const personal = {
            fullName: cv.fullName ?? draft.data.fullName,
            contact: {
              email: cv.contact.email ?? draft.data.contact.email,
              phone: cv.contact.phone ?? draft.data.contact.phone,
            },
          };
          change(
            draftFromData(
              { ...cv, ...personal },
              {
                language,
                workTypes: draft.workTypes,
                sourceText: text,
              },
            ),
          );
        }}
      />

      <CvEditor
        draft={draft}
        errors={fieldErrors}
        errorText={errorText}
        onChange={(next) => {
          setHandEdited(true);
          change(next);
        }}
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
            {meta.savedAt && !dirty ? (
              <Link
                href="/student/cv/preview"
                className="text-brand text-sm font-semibold underline-offset-2 hover:underline"
              >
                {t("previewLink")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-brand text-brand-foreground rounded-lg px-5 py-2 font-semibold disabled:opacity-60"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
