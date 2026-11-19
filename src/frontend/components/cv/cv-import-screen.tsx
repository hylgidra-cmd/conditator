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

const BINARY_EXTENSIONS = [".pdf", ".docx", ".doc"];

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
  const [showPasteArea, setShowPasteArea] = useState(true);
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
    const lower = file.name.toLowerCase();
    if (BINARY_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setSelectedFile(null);
      setShowPasteArea(true);
      setErrorMsg(
        "PDF va Word (.docx) fayllardan matnni nusxalab pastdagi maydonga joylang (yoki .txt fayl yuklang) — AI uni to'liq tuzib beradi.",
      );
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
  }

  async function handleImport() {
    if (!selectedFile && !manualText.trim()) {
      setErrorMsg("Iltimos, .txt fayl tanlang yoki rezyume matnini kiriting.");
      return;
    }

    setImporting(true);
    setErrorMsg(null);

    try {
      let textContent = manualText.trim();

      if (selectedFile) {
        const rawText = await selectedFile.text();
        const cleanText = rawText.trim();
        if (cleanText.length >= 20) {
          textContent = cleanText;
        } else if (!textContent) {
          setErrorMsg(
            "Fayl ichidan yetarli matn topilmadi. Rezyume matnini pastdagi maydonga nusxalab qo'ying.",
          );
          setImporting(false);
          return;
        }
      }

      if (textContent.length < 20) {
        setErrorMsg(
          "Iltimos, kamida 20 ta belgidan iborat rezyume matnini kiriting.",
        );
        setImporting(false);
        return;
      }

      const res = await postJson<{ cv: AiCvDraft }>("/api/cv/generate", {
        text: textContent.slice(0, 3000),
        language: currentLanguage,
      });

      if (res.ok && res.data?.cv) {
        onImportSuccess({ cv: res.data.cv, text: textContent });
        return;
      }

      setErrorMsg(
        res.ok
          ? "AI javobini qayta ishlab bo'lmadi. Qaytadan urinib ko'ring."
          : "AI bilan import qilishda xatolik yuz berdi. Matnni tekshirib qayta urinib ko'ring yoki noldan to'ldiring.",
      );
    } catch {
      setErrorMsg("Tarmoq xatoligi. Qaytadan urinib ko'ring.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="border-border bg-surface space-y-6 rounded-3xl border p-8 text-center shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("uploadTitle")}
          </h2>
          <p className="text-muted mt-2 text-sm">{t("uploadSub")}</p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-colors ${
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
            accept=".txt,.md,text/plain"
            className="hidden"
          />

          <div className="bg-brand/10 text-brand mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <svg
              className="h-7 w-7"
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

          <div className="mt-3 space-y-1">
            {selectedFile ? (
              <p className="text-foreground text-sm font-bold">
                {selectedFile.name}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="bg-brand text-brand-foreground rounded-xl px-6 py-2 text-sm font-bold shadow hover:opacity-95"
                >
                  {t("browse")}
                </button>
                <p className="text-muted pt-1 text-[11px]">
                  {".txt matn fayli yoki pastdagi maydonga PDF/Word dan nusxalab joylang"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Text paste area */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowPasteArea(!showPasteArea)}
            className="text-brand cursor-pointer text-xs font-semibold hover:underline"
          >
            {showPasteArea
              ? "— Matn maydonini yopish"
              : "+ Rezyume matnini to'g'ridan-to'g'ri joylang"}
          </button>
          {showPasteArea && (
            <textarea
              rows={5}
              value={manualText}
              onChange={(e) => {
                setManualText(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="PDF yoki Word rezyumengizdagi ism, ta'lim, ish tajribasi va ko'nikmalar matnini shu yerga nusxalab qo'ying..."
              className="border-border bg-surface focus:ring-brand/40 mt-2 w-full rounded-xl border p-3 text-xs outline-none focus:ring-2"
            />
          )}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-red-500">{errorMsg}</p>
        )}

        {/* Buttons */}
        <div className="border-border/60 flex items-center justify-between border-t pt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-muted hover:text-foreground cursor-pointer text-sm font-semibold"
          >
            {t("back")}
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="bg-brand text-brand-foreground cursor-pointer rounded-xl px-6 py-2.5 text-sm font-bold shadow transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {importing ? "AI tahlil qilmoqda..." : t("importBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
