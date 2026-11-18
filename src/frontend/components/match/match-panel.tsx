"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";
import { FormAlert, useErrorText } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { postJson } from "@/backend/client/api";
import type { MatchOutcome } from "@/backend/match/service";
import { DecisionBadge } from "./decision-badge";

/** Shundan kam natija bo'lsa, sababi (filtr statistikasi) ko'rsatiladi. */
const FEW = 5;
const WEAK_SCORE = 50;

function scoreTone(score: number) {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= WEAK_SCORE) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-700";
}

export function MatchPanel({
  vacancyId,
  initial,
}: {
  vacancyId: string;
  initial: MatchOutcome;
}) {
  const t = useTranslations("Matches");
  const locale = useLocale();
  const errorText = useErrorText();
  const [outcome, setOutcome] = useState(initial);
  const [running, setRunning] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [error, setError] = useState<string>();

  async function run() {
    // Tugma bosilgan zahoti o'chadi: ketma-ket bosish takroriy so'rov yubormaydi (server ham himoyalangan).
    if (running) return;
    setRunning(true);
    setError(undefined);
    const result = await postJson<MatchOutcome>(
      `/api/vacancies/${vacancyId}/match`,
      { locale },
    );
    setRunning(false);
    if (result.ok) setOutcome(result.data);
    else setError(result.error);
  }

  const { results, stats, notice, mode, pending } = outcome;
  const neverRun = mode === "ai" && results.length === 0 && pending > 0;
  const canRun = notice !== "NO_SUBSCRIPTION";
  const weak = mode === "ai" && results.some((item) => item.score < WEAK_SCORE);
  const hasLocked = results.some((item) => item.isLocked);

  return (
    <div className="space-y-5">
      <div className="border-border bg-surface space-y-3 rounded-2xl border p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-sm">
            {t("considered", { count: outcome.considered })}
          </p>
          {canRun ? (
            <button
              type="button"
              onClick={run}
              disabled={running}
              aria-busy={running}
              className="bg-brand text-brand-foreground rounded-lg px-5 py-2 font-semibold disabled:opacity-60"
            >
              {running ? t("running") : neverRun ? t("run") : t("refresh")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-xs font-extrabold transition-colors"
            >
              {"🔓 Abuna olish (14 999 so'm)"}
            </button>
          )}
        </div>
        {running ? (
          <p className="text-muted text-sm">{t("runningHint")}</p>
        ) : null}
        {neverRun && !running ? (
          <p className="text-sm">{t("neverRun", { count: pending })}</p>
        ) : null}
        {!neverRun && mode === "ai" && pending > 0 && !running ? (
          <p className="text-sm">{t("pending", { count: pending })}</p>
        ) : null}
        <FormAlert>{errorText(error)}</FormAlert>
      </div>

      {notice ? (
        <div
          role="status"
          className="border-primary/30 bg-primary-soft text-primary-text flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-medium"
        >
          <span>{t(`notice.${notice}`)}</span>
          {notice === "NO_SUBSCRIPTION" ? (
            <button
              type="button"
              onClick={() => setShowCardModal(true)}
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-xs font-extrabold transition-colors"
            >
              {"🔓 Abuna faollashtirish"}
            </button>
          ) : null}
        </div>
      ) : null}

      {!neverRun && results.length < FEW ? (
        <div className="border-border bg-surface space-y-1 rounded-2xl border p-4 text-sm">
          <p className="font-semibold">
            {stats.visible === 0
              ? t("few.noCvs")
              : t("few.title", { count: stats.passed })}
          </p>
          {stats.visible > 0 ? (
            <p className="text-muted">
              {t("few.stats", {
                visible: stats.visible,
                workType: stats.droppedWorkType,
                language: stats.droppedLanguage,
                location: stats.droppedLocation,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {results.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {mode === "ai" ? t("resultsAi") : t("resultsKeyword")}
          </h2>
          {weak ? <p className="text-muted text-sm">{t("weak")}</p> : null}
          {hasLocked ? (
            <div className="border-primary/30 bg-primary-soft/80 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 backdrop-blur-md">
              <p className="text-text text-sm font-medium">
                {t("unlockBanner")}
              </p>
              <button
                type="button"
                onClick={() => setShowCardModal(true)}
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-5 py-2.5 text-xs font-extrabold transition-colors"
              >
                {"🔓 Abuna olish (14 999 so'm)"}
              </button>
            </div>
          ) : outcome.isVacancyUnlocked ? (
            <div className="border-emerald-500/30 bg-success-soft text-success rounded-2xl border px-4 py-3 text-sm font-medium">
              {t("unlockedBanner")}
            </div>
          ) : null}

          {showCardModal ? (
            <div
              className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowCardModal(false);
              }}
            >
              <div className="ds-modal-panel border-line bg-card shadow-float max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-text text-lg font-extrabold">
                      {"Kompaniya Abunasi (Mukammal CV larni ochish)"}
                    </h3>
                    <p className="text-subtle mt-1 text-xs leading-relaxed">
                      {
                        "14 999 so'm to'lov qilib chek rasmini yuboring. Admin tasdiqlagach, 15 kun davomida barcha 80–100% mos va Mukammal CV lar hamda kontaktlar ochiladi."
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCardModal(false)}
                    className="text-subtle hover:text-text text-xl font-bold"
                  >
                    {"✕"}
                  </button>
                </div>

                <ManualCardPaymentBox
                  purpose="VACANCY_UNLOCK"
                  amountUzs={14999}
                  vacancyId={vacancyId}
                />
              </div>
            </div>
          ) : null}
          <ol className="space-y-3">
            {results.map((item, index) => (
              <li
                key={item.cvId}
                className="border-border bg-surface space-y-2 rounded-2xl border p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {t("candidate", { n: index + 1 })}
                    </h3>
                    <DecisionBadge decision={item.decision} />
                    {item.isLocked ? (
                      <span className="bg-primary-soft text-primary-text rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {t("lockedBadge")}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${scoreTone(item.score)}`}
                    title={mode === "ai" ? t("scoreAi") : t("scoreKeyword")}
                  >
                    {t("score", { score: item.score })}
                  </span>
                </div>
                <p className="text-sm">
                  {item.reason ??
                    (item.matchedTerms && item.matchedTerms.length > 0
                      ? t("matchedTerms", {
                          terms: item.matchedTerms.join(", "),
                        })
                      : t("noTerms"))}
                </p>
                {item.location ? (
                  <p className="text-muted text-sm">
                    {t("location", { location: item.location })}
                  </p>
                ) : null}
                {item.skills.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {item.skills.map((skill) => (
                      <li
                        key={skill}
                        className="bg-brand-soft rounded px-2 py-0.5 text-xs"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
                  <Link
                    href={`/company/vacancies/${vacancyId}/candidates/${item.cvId}`}
                    className="text-brand hover:underline"
                  >
                    {t("openCv")}
                  </Link>
                  {!item.isLocked ? (
                    <a
                      href={`/api/cv/${item.cvId}/pdf?vacancyId=${vacancyId}`}
                      className="text-brand hover:underline"
                    >
                      {t("downloadPdf")}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
