"use client";

import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { CompanySubscriptionPlans } from "@/frontend/components/company/company-subscription-plans";
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

  return (
    <div className="space-y-4">
      {/* Subscription Locked Banner (Variant 1) */}
      {isLocked && (
        <div className="rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-[#051812] via-[#08261D] to-[#0D3D31] p-5 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{"🔒"}</span>
                <h4 className="font-black text-white">
                  {"Nomzod kontaktlari va PDF rezyumesi qulflangan"}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                {
                  "Kompaniya Obunasini faollashtiring — barcha nomzodlarning to'liq ismi, telefon raqami, Telegram, emaili, PDF hujjati va chat darhol ochiladi."
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg transition-all hover:brightness-105 sm:text-sm"
            >
              {"🔓 Obuna sotib olish (15 000 so'mdan)"}
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
              {"Bosqich:"}
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
                ? "border-red-500/30 bg-danger-soft text-danger"
                : "border-line bg-card text-text hover:bg-card-cool"
            }`}
            title="Nomzodga like bosish uning reytingiga +1 bonus qo'shadi"
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likes}</span>
            <span className="hidden sm:inline">{"Yoqdi"}</span>
          </button>
        </div>

        {/* Chat link (gated behind subscription when locked) */}
        <div className="flex items-center gap-2">
          {isLocked ? (
            <button
              type="button"
              onClick={() => setShowUnlockModal(true)}
              className="border-primary/40 bg-primary-soft text-primary-text hover:bg-primary/20 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>{"🔒"}</span>
              <span>{"Chat (Obuna bilan)"}</span>
            </button>
          ) : conversationId ? (
            <Link
              href={`/chat?id=${conversationId}`}
              className="border-primary/40 bg-primary-soft text-primary-text hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>{"💬"}</span>
              <span>{"Yozishish"}</span>
            </Link>
          ) : (
            <Link
              href={`/chat?vacancyId=${vacancyId}&cvId=${cvId}`}
              className="border-primary/40 bg-primary-soft text-primary-text hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>{"💬"}</span>
              <span>{"Chat boshlash"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Subscription Plans Modal */}
      {showUnlockModal && (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUnlockModal(false);
          }}
        >
          <div className="ds-modal-panel bg-card border-line shadow-float max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl border p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-text text-lg font-black">
                  {"Kompaniya Obunasi — Tarifni tanlang"}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed">
                  {
                    "Tarifni tanlab chek rasmini yuboring. Admin tasdiqlagach barcha nomzodlarning kontaktlari, PDF hujjatlari va chat darhol ochiladi."
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="text-subtle hover:text-text cursor-pointer text-xl font-bold"
              >
                {"✕"}
              </button>
            </div>

            <CompanySubscriptionPlans
              vacancyId={vacancyId}
              cvId={cvId}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}
