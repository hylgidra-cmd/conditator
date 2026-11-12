"use client";

import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { Link } from "@/i18n/navigation";
import type { CandidateStageType } from "@prisma/client";

type Props = {
  vacancyId: string;
  cvId: string;
  initialStage?: CandidateStageType;
  initialLikes: number;
  initialLiked: boolean;
  isLocked: boolean;
  candidateName?: string;
  conversationId?: string | null;
};

const STAGES: { value: CandidateStageType; label: string }[] = [
  { value: "NEW", label: "Yangi" },
  { value: "REVIEWING", label: "Ko'rib chiqilmoqda" },
  { value: "LIKED", label: "Yoqdi" },
  { value: "INTERVIEW", label: "Suhbat" },
  { value: "ACCEPTED", label: "Qabul qilindi" },
  { value: "REJECTED", label: "Rad etildi" },
];

export function CandidateActions({
  vacancyId,
  cvId,
  initialStage = "NEW",
  initialLikes,
  initialLiked,
  isLocked,
  conversationId,
}: Props) {
  const [stage, setStage] = useState<CandidateStageType>(initialStage);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [paying, setPaying] = useState(false);

  async function handleStageChange(newStage: CandidateStageType) {
    setUpdatingStage(true);
    setStage(newStage);
    try {
      await postJson(`/api/vacancies/${vacancyId}/candidates/${cvId}/stage`, {
        stage: newStage,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleLike() {
    if (togglingLike) return;
    setTogglingLike(true);
    try {
      const res = await postJson<{ liked: boolean; totalLikes: number }>(
        `/api/candidates/${cvId}/like`,
        {},
      );
      if (res.ok) {
        setLiked(res.data.liked);
        setLikes(res.data.totalLikes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingLike(false);
    }
  }

  async function handleUnlockCheckout(provider: "CLICK" | "PAYME" | "TEST") {
    setPaying(true);
    try {
      const res = await postJson<{ paymentId: string; redirectUrl: string }>(
        "/api/payments/checkout",
        {
          purpose: "VACANCY_UNLOCK",
          provider,
          vacancyId,
          cvId,
          returnUrl: window.location.href,
        },
      );
      if (res.ok && res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    } catch (err) {
      console.error(err);
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 80-100% Locked Banner */}
      {isLocked && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <h4 className="font-bold text-amber-950">
                  80–100% Mos nomzod kontaktlari qulflangan
                </h4>
              </div>
              <p className="text-sm text-amber-900">
                Ushbu vakansiya bo&apos;yicha barcha yuqori mos nomzodlarning
                to&apos;liq kontaktlarini 15 kunga oching.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="rounded-xl bg-[#F07A1A] px-5 py-2.5 text-sm font-bold text-white shadow transition-colors hover:bg-[#d86912]"
            >
              Kontaktlarni ochish — 14 999 so&apos;m
            </button>
          </div>
        </div>
      )}

      {/* Action bar: Stage, Like, Chat */}
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* HeadHunter Stage Selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">
              Bosqich:
            </span>
            <select
              value={stage}
              disabled={updatingStage}
              onChange={(e) =>
                handleStageChange(e.target.value as CandidateStageType)
              }
              className="border-border focus:border-brand bg-surface rounded-lg border px-3 py-1.5 text-sm font-medium outline-none focus:ring-2"
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Like button with rating bonus */}
          <button
            type="button"
            onClick={handleLike}
            disabled={togglingLike}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
              liked
                ? "border-red-300 bg-red-50 text-red-600"
                : "border-border bg-surface text-gray-700 hover:bg-gray-50"
            }`}
            title="Nomzodga like bosish uning reytingiga +1 bonus qo'shadi"
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likes}</span>
            <span className="hidden sm:inline">Yoqdi</span>
          </button>
        </div>

        {/* Chat link */}
        <div className="flex items-center gap-2">
          {conversationId ? (
            <Link
              href={`/chat?id=${conversationId}`}
              className="border-brand bg-brand-soft text-brand hover:bg-brand/10 inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>💬</span>
              <span>Yozishish</span>
            </Link>
          ) : (
            <Link
              href={`/chat?vacancyId=${vacancyId}&cvId=${cvId}`}
              className="border-brand bg-brand-soft text-brand hover:bg-brand/10 inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>💬</span>
              <span>Chat boshlash</span>
            </Link>
          )}
        </div>
      </div>

      {/* Unlock Checkout Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border-border w-full max-w-md space-y-4 rounded-2xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Nomzodlarni ochish</h3>
                <p className="text-muted mt-1 text-sm">
                  14 999 so&apos;m evaziga ushbu vakansiya bo&apos;yicha 15
                  kunga barcha 80-100% mos nomzodlarning telefon va emaillari
                  ochiladi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="text-muted hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                To&apos;lov tizimini tanlang:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => handleUnlockCheckout("CLICK")}
                  className="border-border hover:border-brand flex flex-col items-center justify-center rounded-xl border p-3 font-semibold transition-colors hover:bg-blue-50"
                >
                  <span className="font-bold text-blue-600">CLICK</span>
                  <span className="text-muted text-xs">14 999 UZS</span>
                </button>
                <button
                  type="button"
                  disabled={paying}
                  onClick={() => handleUnlockCheckout("PAYME")}
                  className="border-border hover:border-brand flex flex-col items-center justify-center rounded-xl border p-3 font-semibold transition-colors hover:bg-teal-50"
                >
                  <span className="font-bold text-teal-600">PAYME</span>
                  <span className="text-muted text-xs">14 999 UZS</span>
                </button>
              </div>
              <button
                type="button"
                disabled={paying}
                onClick={() => handleUnlockCheckout("TEST")}
                className="mt-2 w-full rounded-xl bg-gray-100 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                🧪 Sinov / Sandbox to&apos;lov (Tezkor tasdiqlash)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
