"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { CompanySubscriptionPlans } from "@/frontend/components/company/company-subscription-plans";
import { SparkIcon } from "@/frontend/components/icons";

type Props = {
  hasActiveAbuna: boolean;
  subscriptionUntilLabel?: string | null;
  mukammalCount: number;
  openCount: number;
};

export function StudentsSubscriptionBar({
  hasActiveAbuna,
  subscriptionUntilLabel,
  mukammalCount,
  openCount,
}: Props) {
  const router = useRouter();
  const locale = useLocale();
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [showAbunaModal, setShowAbunaModal] = useState(false);

  async function handleAiScan() {
    if (scanning) return;
    setScanning(true);
    setScanMessage(null);
    const res = await postJson<{
      ok: boolean;
      mode: "ai" | "smart";
      evaluatedCount: number;
      mukammalCount: number;
    }>("/api/company/students/ai-scan", {
      run: true,
      locale,
    });
    setScanning(false);
    if (res.ok) {
      setScanMessage(
        `AI ${res.data.evaluatedCount} ta CV ni o'qib chiqdi: ${res.data.mukammalCount} ta Mukammal CV (80–100%) aniqlandi.`,
      );
      router.refresh();
    }
  }

  const totalCount = mukammalCount + openCount;
  const subBadgeText = subscriptionUntilLabel
    ? `Faol Obuna (${subscriptionUntilLabel} gacha)`
    : "Faol Obuna";
  const mukammalStatLabel = `🌟 Mukammal CV (80–100%): ${mukammalCount} ta`;
  const totalStatLabel = `📄 Jami nomzodlar: ${totalCount} ta`;

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl sm:p-6 ${
          hasActiveAbuna
            ? "border-emerald-500/35 bg-emerald-500/10"
            : "border-emerald-500/35 bg-gradient-to-br from-[#051812] via-[#08261D] to-[#0D3D31] text-white shadow-[0_20px_50px_-15px_rgb(5,24,18,0.55)]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-slate-950">
                <SparkIcon size={13} />
                {"AI CV Analizator"}
              </span>
              {hasActiveAbuna ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  {subBadgeText}
                </span>
              ) : (
                <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-extrabold text-amber-300">
                  {"🔒 Obuna faol emas — Teaser rejimi"}
                </span>
              )}
            </div>

            <h2
              className={`text-base font-extrabold sm:text-lg ${
                hasActiveAbuna ? "text-text" : "text-white"
              }`}
            >
              {hasActiveAbuna
                ? "Barcha nomzodlarning kontaktlari, PDF rezyumelari va AI saralash siz uchun ochiq"
                : "Nomzodlarning telefon, Telegram, email va PDF CV larini ko'rish uchun Obuna oling"}
            </h2>

            <p
              className={`text-xs leading-relaxed sm:text-sm ${
                hasActiveAbuna ? "text-subtle" : "text-emerald-100/80"
              }`}
            >
              {hasActiveAbuna
                ? "Faol obunangiz bilan barcha CV larning to'liq ismi, telefon raqami, Telegram, emaili va PDF hujjatlarini cheksiz ko'rishingiz hamda yuklab olishingiz mumkin."
                : "Hozir siz barcha nomzodlarning mutaxassisligi, ko'nikmalari, hududi va AI bahosini (%) ko'rib turibsiz. Obuna sotib olishingiz bilan (15 000 so'mdan) barcha kontaktlar, PDF yuklash va chat darhol ochiladi."}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold">
              <span
                className={`rounded-xl border px-3 py-1 ${
                  hasActiveAbuna
                    ? "border-primary/30 bg-primary-soft text-primary-text"
                    : "border-emerald-400/30 bg-white/10 text-emerald-200"
                }`}
              >
                {mukammalStatLabel}
              </span>
              <span
                className={`rounded-xl border px-3 py-1 ${
                  hasActiveAbuna
                    ? "border-line bg-canvas text-text"
                    : "border-white/15 bg-white/5 text-white/90"
                }`}
              >
                {totalStatLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAiScan}
              disabled={scanning}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] disabled:opacity-60 ${
                hasActiveAbuna
                  ? "border-line bg-canvas text-text hover:border-primary"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <SparkIcon
                size={15}
                className={hasActiveAbuna ? "text-primary" : "text-emerald-300"}
              />
              {scanning
                ? "AI CV larni o'qimoqda..."
                : "AI bilan CV larni qayta o'qish"}
            </button>

            <button
              type="button"
              onClick={() => setShowAbunaModal(true)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition-all active:scale-[0.98] ${
                hasActiveAbuna
                  ? "border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-lg hover:brightness-105"
              }`}
            >
              {hasActiveAbuna
                ? "✨ Obunani uzaytirish"
                : "🔓 Obuna sotib olish (15 000 so'mdan)"}
            </button>
          </div>
        </div>

        {scanMessage ? (
          <p
            className={`mt-3 text-xs font-bold ${
              hasActiveAbuna ? "text-primary-text" : "text-emerald-300"
            }`}
          >
            {scanMessage}
          </p>
        ) : null}
      </div>

      {showAbunaModal ? (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAbunaModal(false);
          }}
        >
          <div className="ds-modal-panel border-line bg-card shadow-float max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl border p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-text text-lg font-black sm:text-xl">
                  {"Kompaniya Obunasi — Tarifni tanlang"}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed">
                  {
                    "Tarifni tanlab to'lov chekini yuboring. Admin «Qabul qilindi» tugmasini bosishi bilan barcha nomzodlarning kontaktlari, PDF rezyumelari va chat darhol ochiladi."
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAbunaModal(false)}
                className="text-subtle hover:text-text cursor-pointer text-xl font-bold"
              >
                {"✕"}
              </button>
            </div>

            <CompanySubscriptionPlans compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
