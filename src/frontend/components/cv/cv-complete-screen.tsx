"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CvDocument } from "@/frontend/components/cv-document/cv-document";
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
}: Props) {
  const t = useTranslations("StudentCv.complete");
  const tCv = useTranslations("StudentCv");
  const locale = useLocale();
  const [payingProvider, setPayingProvider] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [togglingVis, setTogglingVis] = useState(false);

  const data = dataFromDraft(draft);
  const pdfUrl = meta.id ? `/api/cv/${meta.id}/pdf` : "/api/cv/me/pdf";

  async function handleCheckout(provider: "CLICK" | "PAYME" | "TEST") {
    if (!meta.id) return;
    setPayingProvider(provider);
    setPayError(null);
    try {
      const returnUrl = `/${locale}/student/cv?cvId=${meta.id}`;
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "CV_CREATION",
          provider,
          cvId: meta.id,
          returnUrl,
        }),
      });
      const json = (await res.json()) as {
        redirectUrl?: string;
        error?: string;
      };
      if (!res.ok || !json.redirectUrl) {
        setPayError(json.error || "PAYMENT_FAILED");
        setPayingProvider(null);
        return;
      }
      window.location.href = json.redirectUrl;
    } catch {
      setPayError("NETWORK_ERROR");
      setPayingProvider(null);
    }
  }

  async function handleVisibility(checked: boolean) {
    setTogglingVis(true);
    try {
      await onToggleVisibility(checked);
    } finally {
      setTogglingVis(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Success Banner */}
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-500">
            ✓
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
            className="border-border bg-surface text-foreground hover:bg-muted/20 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors"
          >
            {t("backToEdit")}
          </button>
          <a
            href={pdfUrl}
            className="bg-brand text-brand-foreground rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-opacity hover:opacity-95"
          >
            {t("downloadPdf")}
          </a>
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
          <div className="border-border bg-surface space-y-4 rounded-3xl border p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-foreground text-base font-extrabold">
                {t("paymentTitle")}
              </h3>
              {meta.isPaid ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t("paymentBadgePaid")}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {t("paymentBadgeUnpaid")}
                </span>
              )}
            </div>

            <p className="text-muted text-xs leading-relaxed">
              {t("paymentDesc")}
            </p>

            {!meta.isPaid && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={Boolean(payingProvider)}
                  onClick={() => handleCheckout("CLICK")}
                  className="rounded-xl bg-[#00AEEF] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {payingProvider === "CLICK" ? t("paying") : t("payWithClick")}
                </button>
                <button
                  type="button"
                  disabled={Boolean(payingProvider)}
                  onClick={() => handleCheckout("PAYME")}
                  className="rounded-xl bg-[#00CCCC] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {payingProvider === "PAYME" ? t("paying") : t("payWithPayme")}
                </button>
                <button
                  type="button"
                  disabled={Boolean(payingProvider)}
                  onClick={() => handleCheckout("TEST")}
                  className="border-border bg-muted/20 text-foreground hover:bg-muted/40 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {payingProvider === "TEST" ? t("paying") : t("payWithTest")}
                </button>
              </div>
            )}

            {payError && (
              <p className="text-xs font-semibold text-red-500">{payError}</p>
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
                disabled={togglingVis}
                onChange={(e) => handleVisibility(e.target.checked)}
                className="text-brand focus:ring-brand h-5 w-5 cursor-pointer rounded"
              />
            </div>

            <div className="border-border/60 flex flex-wrap gap-2.5 border-t pt-4">
              <Link
                href="/student/cv/preview"
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
                className="border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
              >
                {t("createNewCv")}
              </button>
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
                {t("browseAllVacancies")} →
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

        {/* Right Column: Compact A4 Paper Preview */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="border-border bg-muted/20 sticky top-20 rounded-3xl border p-4 shadow-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
