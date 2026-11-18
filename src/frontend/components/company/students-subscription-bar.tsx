"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { SparkIcon } from "@/frontend/components/icons";
import { ManualCardPaymentBox } from "@/frontend/components/payment/manual-card-payment";

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

  const subBadgeText = subscriptionUntilLabel
    ? `Faol Abuna (${subscriptionUntilLabel} gacha)`
    : "Faol Abuna";
  const mukammalStatLabel = `🌟 Mukammal CV (80–100%): ${mukammalCount} ta`;
  const openStatLabel = `📄 Pastroq / Ochiq CV (<80%): ${openCount} ta`;

  return (
    <div className="space-y-4">
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl sm:p-6 ${
          hasActiveAbuna
            ? "border-emerald-500/35 bg-emerald-500/10"
            : "border-primary/35 bg-card/95 shadow-soft"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary text-on-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold">
                <SparkIcon size={13} />
                {"AI CV Analizator"}
              </span>
              {hasActiveAbuna ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  {subBadgeText}
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                  {"🔒 Abuna faol emas"}
                </span>
              )}
            </div>

            <h2 className="text-text text-base font-extrabold sm:text-lg">
              {hasActiveAbuna
                ? "Barcha Mukammal (80–100%) va boshlang'ich CV lar siz uchun ochiq"
                : "Mukammal ishlangan CV larni (80–100%) ko'rish uchun Abuna talab etiladi"}
            </h2>

            <p className="text-subtle text-xs leading-relaxed sm:text-sm">
              {hasActiveAbuna
                ? "AI har bir CV ni o'qib, tajriba, ta'lim va ko'nikmalar bo'yicha 0–100% ball beradi. Faol abunangiz bilan barcha nomzodlarning kontaktlari va PDF rezyumelarini to'liq ko'rishingiz mumkin."
                : "AI barcha CV larni o'qiydi va baholaydi: 80% dan pastroq CV lar barcha tasdiqlangan firmalarga bepul ko'rinadi, 80–100% ball olgan Mukammal CV lar va ularning kontaktlari esa Abuna bilan ochiladi."}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold">
              <span className="border-primary/30 bg-primary-soft text-primary-text rounded-xl border px-3 py-1">
                {mukammalStatLabel}
              </span>
              <span className="border-line bg-canvas text-text rounded-xl border px-3 py-1">
                {openStatLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAiScan}
              disabled={scanning}
              className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <SparkIcon size={15} className="text-primary" />
              {scanning
                ? "AI CV larni o'qimoqda..."
                : "AI bilan CV larni qayta o'qish"}
            </button>

            {!hasActiveAbuna ? (
              <button
                type="button"
                onClick={() => setShowAbunaModal(true)}
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all active:scale-[0.98]"
              >
                {"🔓 Abuna olish — 14 999 so'm"}
              </button>
            ) : null}
          </div>
        </div>

        {scanMessage ? (
          <p className="text-primary-text mt-3 text-xs font-bold">
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
          <div className="ds-modal-panel border-line bg-card shadow-float max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-text text-lg font-extrabold">
                  {"Kompaniya Abunasi (Mukammal CV larni ochish)"}
                </h3>
                <p className="text-subtle mt-1 text-xs leading-relaxed">
                  {
                    "14 999 so'm to'lov qilib chek rasmini yuboring. Admin tasdiqlagach, 15 kun davomida barcha 80–100% Mukammal CV lar va nomzodlar kontaktlari to'liq ochiladi."
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAbunaModal(false)}
                className="text-subtle hover:text-text text-xl font-bold"
              >
                {"✕"}
              </button>
            </div>

            <ManualCardPaymentBox
              purpose="VACANCY_UNLOCK"
              amountUzs={14999}
              onSubmitted={() => {
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
