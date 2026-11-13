"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
  const [unlocking, setUnlocking] = useState(false);
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

  async function unlockVacancy() {
    if (unlocking) return;
    setUnlocking(true);
    setError(undefined);
    const result = await postJson<{ paymentId: string; redirectUrl: string }>(
      "/api/payments/checkout",
      {
        purpose: "VACANCY_UNLOCK",
        provider: "TEST",
        vacancyId,
        returnUrl: window.location.href,
      },
    );
    if (result.ok && result.data.redirectUrl) {
      window.location.href = result.data.redirectUrl;
      return;
    }
    setUnlocking(false);
    if (!result.ok) setError(result.error);
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
          ) : null}
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
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {t(`notice.${notice}`)}
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4">
              <p className="text-sm font-medium text-amber-900">
                {t("unlockBanner")}
              </p>
              <button
                type="button"
                onClick={unlockVacancy}
                disabled={unlocking}
                className="rounded-xl bg-[#F07A1A] px-4 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-[#d86912] disabled:opacity-60"
              >
                {t("unlockBtn")}
              </button>
            </div>
          ) : outcome.isVacancyUnlocked ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800">
              {t("unlockedBanner")}
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
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
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
