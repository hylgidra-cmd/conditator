"use client";

import { useTranslations } from "next-intl";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { postJson } from "@/backend/client/api";
import type { AiCvDraft } from "@/backend/cv/schema";

type Props = {
  currentLanguage: string;
  onBack: () => void;
  onImportSuccess: (result: { cv: AiCvDraft; text: string }) => void;
};

export function CvImportScreen({
  currentLanguage,
  onBack,
  onImportSuccess,
}: Props) {
  const t = useTranslations("StudentCv.onboarding");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  }

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setErrorMsg(null);
  }

  async function handleImport() {
    if (!selectedFile && !manualText.trim()) {
      setErrorMsg("Iltimos, fayl tanlang yoki rezyume matnini kiriting.");
      return;
    }

    setImporting(true);
    setErrorMsg(null);

    try {
      let textContent = manualText.trim();

      if (selectedFile) {
        try {
          const rawText = await selectedFile.text();
          // Filter readable characters
          const cleanText = rawText.replace(/[^\x20-\x7E\s\u0400-\u04FF]/g, " ").trim();
          if (cleanText.length > 30) {
            textContent = cleanText;
          } else {
            textContent = `${selectedFile.name}\n${textContent}`;
          }
        } catch {
          textContent = selectedFile.name;
        }
      }

      if (!textContent) {
        textContent = selectedFile?.name ?? "Rezyume";
      }

      const res = await postJson<{ cv: AiCvDraft }>(
        "/api/cv/generate",
        {
          text: textContent,
          language: currentLanguage,
        },
      );

      if (res.ok && res.data?.cv) {
        onImportSuccess({ cv: res.data.cv, text: textContent });
      } else {
        // Fallback with empty template if AI limit is reached
        onImportSuccess({
          cv: {
            goal: null,
            location: null,
            education: [],
            experience: [],
            skills: [],
            languages: [],
            certificates: [],
          },
          text: textContent,
        });
      }
    } catch {
      onImportSuccess({
        cv: {
          goal: null,
          location: null,
          education: [],
          experience: [],
          skills: [],
          languages: [],
          certificates: [],
        },
        text: selectedFile?.name ?? "",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("uploadTitle")}
          </h2>
          <p className="text-muted mt-2 text-sm">
            {t("uploadSub")}
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-brand bg-brand/5"
              : selectedFile
                ? "border-emerald-500 bg-emerald-50/20"
                : "border-border hover:border-brand/60 bg-muted/20"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div className="mt-4 space-y-1">
            {selectedFile ? (
              <p className="font-bold text-foreground text-sm">
                {selectedFile.name}
              </p>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-brand-foreground shadow hover:opacity-95"
              >
                {t("browse")}
              </button>
            )}
          </div>
        </div>

        {/* Optional text paste */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowPasteArea(!showPasteArea)}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {showPasteArea ? "— Matn maydonini yopish" : "+ Yoki rezyume matnini to'g'ridan-to'g'ri joylang"}
          </button>
          {showPasteArea && (
            <textarea
              rows={4}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="O'quv yurti, tajriba, ko'nikmalar matnini shu yerga nusxalab qo'ying..."
              className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-xs outline-none focus:ring-2 focus:ring-brand/40"
            />
          )}
        </div>

        {errorMsg && (
          <p className="text-red-500 text-xs font-medium">{errorMsg}</p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-muted hover:text-foreground"
          >
            {t("back")}
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-brand-foreground shadow hover:opacity-95 transition-opacity disabled:opacity-60"
          >
            {importing ? "Yuklanmoqda..." : t("importBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
