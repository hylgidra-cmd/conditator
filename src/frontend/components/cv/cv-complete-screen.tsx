"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CvPaymentShield } from "@/frontend/components/cv/cv-payment-shield";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import type {
  CvDocumentLabels,
  CvDocumentLanguage,
} from "@/backend/cv-document/types";
import type { MatchingVacancyPreview } from "@/backend/cv/service";
import type { WorkType } from "@prisma/client";
import { type CvDraft, dataFromDraft, type SavedCvMeta } from "./types";

type Props = {
  draft: CvDraft;
  meta: SavedCvMeta;
  labels: CvDocumentLabels;
  matchingVacancies: MatchingVacancyPreview[];
  paymentSuccess?: boolean;
  onBackToEdit: () => void;
  onToggleVisibility: (isVisible: boolean) => Promise<void>;
  onCreateNew: () => void;
  onDeleteCv?: () => Promise<void>;
};

export function CvCompleteScreen({
  draft,
  meta,
  labels,
  matchingVacancies,
  paymentSuccess,
  onBackToEdit,
  onToggleVisibility,
  onCreateNew,
  onDeleteCv,
}: Props) {
  const t = useTranslations("StudentCv.complete");
  const tCv = useTranslations("StudentCv");
  const [togglingVis, setTogglingVis] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const data = dataFromDraft(draft);
  const pdfUrl = meta.id
    ? `/api/cv/me/pdf?cvId=${encodeURIComponent(meta.id)}`
    : "/api/cv/me/pdf";
  const docxUrl = meta.id
    ? `/api/cv/me/docx?cvId=${encodeURIComponent(meta.id)}`
    : "/api/cv/me/docx";
  const previewUrl = meta.id
    ? `/student/cv/preview?cvId=${encodeURIComponent(meta.id)}`
    : "/student/cv/preview";

  async function handleVisibility(checked: boolean) {
    setTogglingVis(true);
    try {
      await onToggleVisibility(checked);
    } finally {
      setTogglingVis(false);
    }
  }

  async function handleDelete() {
    if (!onDeleteCv || deleting) return;
    if (!window.confirm("Ushbu CV ni butunlay o'chirmoqchimisiz?")) return;
    setDeleting(true);
    try {
      await onDeleteCv();
    } finally {
      setDeleting(false);
    }
  }

  function scrollToPayment() {
    document
      .getElementById("cv-payment-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      {/* Top Success Banner */}
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-500">
            {"✓"}
          </div>
          <div>
            <h2 className="text-foreground text-xl font-black sm:text-2xl">
              {t("title")}
            </h2>
            <p className="text-muted mt-1 text-sm">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToEdit}
            className="border-border bg-surface text-foreground hover:bg-muted/20 cursor-pointer rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors"
          >
            {t("backToEdit")}
          </button>
          {meta.isPaid ? (
            <>
              <a
                href={pdfUrl}
                className="bg-brand text-brand-foreground rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-opacity hover:opacity-95"
              >
                {t("downloadPdf")}
              </a>
              {draft.templateId === "obyektivka" ? (
                <a
                  href={docxUrl}
                  className="border-primary/40 bg-primary-soft text-primary-text rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors hover:opacity-90"
                >
                  {"📄 Word (.docx)"}
                </a>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={scrollToPayment}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover cursor-pointer rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all"
            >
              {"🔒 PDF / DOCX ochish (5 000 so'm)"}
            </button>
          )}
        </div>
      </div>

      {paymentSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {t("paymentSuccess")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Payment, Visibility, Actions & Matching Vacancies */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Payment / Activation Card (5 000 so'm) */}
          <div
            id="cv-payment-section"
            className="border-border bg-surface space-y-4 rounded-3xl border p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-foreground text-base font-extrabold">
                {t("paymentTitle")}
              </h3>
              {meta.isPaid ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t("paymentBadgePaid")}
                </span>
              ) : (
                <span className="bg-primary-soft text-primary-text rounded-full px-3 py-1 text-xs font-bold">
                  {t("paymentBadgeUnpaid")}
                </span>
              )}
            </div>

            <p className="text-muted text-xs leading-relaxed">
              {meta.isPaid
                ? t("paymentDesc")
                : "To'lov tasdiqlangach, skrinshot va ekran yozib olish cheklovi avtomatik olib tashlanadi, toza PDF/DOCX yuklash va kompaniyalarga ko'rinish ochiladi."}
            </p>

            {!meta.isPaid && meta.id && (
              <ManualCardPaymentBox
                purpose="CV_CREATION"
                amountUzs={5000}
                cvId={meta.id}
              />
            )}
          </div>

          {/* 2. Visibility & Quick Actions */}
          <div className="border-border bg-surface space-y-4 rounded-3xl border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-foreground text-sm font-bold">
                  {t("visibilityTitle")}
                </h3>
                <p className="text-muted mt-0.5 text-xs">
                  {t("visibilityDesc")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={meta.isVisible}
                disabled={togglingVis || !meta.isPaid}
                onChange={(e) => handleVisibility(e.target.checked)}
                className="text-brand focus:ring-brand h-5 w-5 cursor-pointer rounded disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="border-border/60 flex flex-wrap items-center justify-between gap-2.5 border-t pt-4">
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={previewUrl}
                  className="border-border bg-surface text-foreground hover:bg-muted/20 rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                >
                  {t("fullPreview")}
                </Link>
                <Link
                  href="/student/applications"
                  className="border-border bg-surface text-foreground hover:bg-muted/20 rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                >
                  {t("myApplicationsBtn")}
                </Link>
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 cursor-pointer rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                >
                  {t("createNewCv")}
                </button>
              </div>
              {onDeleteCv && meta.id ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-danger cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting ? "O'chirilmoqda..." : "🗑️ CV ni o'chirish"}
                </button>
              ) : null}
            </div>
          </div>

          {/* 3. Matching Vacancies */}
          <div className="border-border bg-surface space-y-4 rounded-3xl border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-foreground text-base font-extrabold">
                {t("matchingTitle")}
              </h3>
              <Link
                href="/vacancies"
                className="text-brand text-xs font-bold hover:underline"
              >
                {t("browseAllVacancies")} {"→"}
              </Link>
            </div>

            {matchingVacancies.length === 0 ? (
              <p className="text-muted text-xs">{t("matchingEmpty")}</p>
            ) : (
              <div className="space-y-3">
                {matchingVacancies.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vacancies/${v.id}`}
                    className="border-border bg-surface hover:border-brand group block rounded-2xl border p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-muted text-[11px] font-bold uppercase">
                          {v.companyName}
                        </p>
                        <h4 className="text-foreground group-hover:text-brand text-sm font-bold transition-colors">
                          {v.title}
                        </h4>
                      </div>
                      <span className="bg-brand/10 text-brand rounded-full px-2.5 py-0.5 text-[11px] font-extrabold">
                        {t("matchBadge", { score: v.matchScore })}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {v.workType && (
                          <span className="bg-muted/20 text-muted rounded-md px-2 py-0.5 text-[10px] font-semibold">
                            {tCv(
                              `workTypes.${v.workType}` as "workTypes.FULL_TIME",
                            )}
                          </span>
                        )}
                        {v.skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="border-border text-muted rounded-md border px-2 py-0.5 text-[10px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                      <span className="text-brand text-xs font-bold">
                        {t("applyBtn")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Compact A4 Paper Preview wrapped in CvPaymentShield */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="border-border bg-muted/20 sticky top-20 rounded-3xl border p-4 shadow-sm">
            <CvPaymentShield
              isPaid={Boolean(meta.isPaid)}
              onUnlockClick={scrollToPayment}
            >
              <div className="border-border bg-surface relative w-full overflow-hidden rounded-2xl border shadow-md">
                <div
                  className="flex justify-center"
                  style={{ height: `${1123 * 0.56 + 24}px` }}
                >
                  <div
                    style={{
                      width: "794px",
                      minWidth: "794px",
                      transform: "scale(0.56)",
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
            </CvPaymentShield>
          </div>
        </div>
      </div>
    </div>
  );
}
