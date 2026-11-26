"use client";

import { type ReactNode, useEffect, useState } from "react";

type Props = {
  isPaid: boolean;
  watermarkTag?: string;
  onUnlockClick?: () => void;
  children: ReactNode;
};

type ShieldTrigger = (reason: string) => void;

const activeDisplayMediaListeners = new Set<ShieldTrigger>();
let savedOriginalDisplayMedia:
  | typeof navigator.mediaDevices.getDisplayMedia
  | null = null;

function registerDisplayMediaGuard(trigger: ShieldTrigger): () => void {
  const mediaDevices =
    typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  activeDisplayMediaListeners.add(trigger);

  if (
    activeDisplayMediaListeners.size === 1 &&
    mediaDevices &&
    typeof mediaDevices.getDisplayMedia === "function"
  ) {
    savedOriginalDisplayMedia = mediaDevices.getDisplayMedia.bind(mediaDevices);
    try {
      Object.defineProperty(mediaDevices, "getDisplayMedia", {
        configurable: true,
        value: async () => {
          for (const listener of activeDisplayMediaListeners) {
            listener(
              "Ekran yozib olish (Screen Recording) to'lanmagan CV da taqiqlangan.",
            );
          }
          throw new DOMException(
            "Screen recording is disabled for unpaid CVs.",
            "NotAllowedError",
          );
        },
      });
    } catch {
      savedOriginalDisplayMedia = null;
    }
  }

  return () => {
    activeDisplayMediaListeners.delete(trigger);
    if (
      activeDisplayMediaListeners.size === 0 &&
      mediaDevices &&
      savedOriginalDisplayMedia
    ) {
      try {
        Object.defineProperty(mediaDevices, "getDisplayMedia", {
          configurable: true,
          value: savedOriginalDisplayMedia,
        });
      } catch {
        // ignore
      }
      savedOriginalDisplayMedia = null;
    }
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest(".cv-unpaid-protected-content")) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * To'lanmagan CV oldindan ko'rinishini skrinshot, ekran yozib olish, chop etish (Ctrl+P)
 * va nusxa ko'chirishdan himoyalaydigan ko'p qatlamli qalqon.
 * To'lov tasdiqlangach (`isPaid === true`) barcha cheklovlar avtomatik o'chiriladi.
 */
export function CvPaymentShield({
  isPaid,
  onUnlockClick,
  children,
}: Props) {
  const [blackout, setBlackout] = useState(false);
  const [warningReason, setWarningReason] = useState<string | null>(null);

  useEffect(() => {
    if (isPaid) return;

    const triggerShield = (reason: string) => {
      setBlackout(true);
      setWarningReason(reason);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      const isPrintScreen =
        e.key === "PrintScreen" || e.code === "PrintScreen";
      const isMacOrWinCapture =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (key === "3" || key === "4" || key === "5" || key === "s");
      const isCopy = ctrlOrMeta && key === "c" && !e.shiftKey;
      const isPrintOrSave =
        ctrlOrMeta &&
        (key === "p" ||
          key === "s" ||
          key === "u" ||
          (isCopy && !isEditableTarget(e.target)));
      const isDevTools =
        e.key === "F12" ||
        (ctrlOrMeta && e.shiftKey && (key === "i" || key === "j" || key === "c"));

      if (isPrintScreen || isMacOrWinCapture || isPrintOrSave || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        if (isPrintScreen && typeof navigator !== "undefined") {
          navigator.clipboard?.writeText("").catch(() => undefined);
        }
        triggerShield(
          isPrintScreen || isMacOrWinCapture
            ? "Skrinshot va ekran yozib olish to'lov qilinmaguncha bloklangan."
            : "Chop etish, saqlash va nusxalash faqat to'lovdan so'ng ochiladi.",
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        triggerShield(
          "Skrinshot olish bloklandi. To'lovdan so'ng toza PDF va DOCX yuklab olishingiz mumkin.",
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerShield(
          "Oyna yashirilganda yoki ekran yozib olish/skrinshot ilovasi ochilganda CV avtomatik yopiladi.",
        );
      }
    };

    const handleBlur = () => {
      triggerShield(
        "Himoyalangan rejim faollashdi (fokus yo'qoldi). Skrinshot va ekran zapis to'lovdan so'ng ochiladi.",
      );
    };

    const handleBeforePrint = () => {
      triggerShield(
        "Chop etish (Print/PDF) to'lov tasdiqlangandan so'ng faollashadi.",
      );
    };

    const unregisterDisplayMedia = registerDisplayMediaGuard(triggerShield);

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeprint", handleBeforePrint);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeprint", handleBeforePrint);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unregisterDisplayMedia();
    };
  }, [isPaid]);

  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Print-to-PDF / Ctrl+P to'liq bloklash */}
      <style>{`
        @media print {
          .cv-unpaid-protected-content { display: none !important; visibility: hidden !important; }
          .cv-unpaid-print-warning { display: flex !important; }
        }
      `}</style>

      <div className="cv-unpaid-print-warning hidden min-h-[260mm] flex-col items-center justify-center bg-white p-12 text-center text-slate-900">
        <p className="text-2xl font-black">
          {"🔒 TO'LANMAGAN CV — CHOP ETISH TAQIQLANGAN"}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {
            "CV ni toza PDF / DOCX formatda yuklab olish va chop etish uchun avval to'lovni (5 000 so'm) tasdiqlating."
          }
        </p>
      </div>

      {/* Himoya holati banneri */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
          <span>{"🛡️"}</span>
          <span>
            {
              "Himoyalangan ko'rinish: to'lovdan oldin skrinshot, ekran yozib olish va PDF yuklash yopiq."
            }
          </span>
        </div>
        {onUnlockClick ? (
          <button
            type="button"
            onClick={onUnlockClick}
            className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover cursor-pointer rounded-xl px-3.5 py-1.5 text-[11px] font-extrabold transition-all"
          >
            {"🔓 To'lov qilib ochish (5 000 so'm)"}
          </button>
        ) : null}
      </div>

      {/* Asosiy CV kontenti + Qora himoya pardasi */}
      <div className="cv-unpaid-protected-content relative overflow-hidden rounded-2xl">
        <div
          className={
            blackout
              ? "pointer-events-none opacity-0 blur-2xl transition-all duration-100"
              : "transition-all duration-150"
          }
        >
          {children}
        </div>

        {/* Skrinshot / Fokus yo'qolishi / Ekran yozish aniqlanganda chiqadigan qora qalqon */}
        {blackout ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#041410]/98 p-6 text-center text-white backdrop-blur-xl">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 text-2xl">
              {"🔒"}
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-black text-white">
                {"Skrinshot va ekran yozib olish himoyasi faol"}
              </h3>
              <p className="text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
                {warningReason ??
                  "To'lov amalga oshirilmaguncha CV ni skrinshot qilish, ekran yozib olish yoki chop etish taqiqlangan."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBlackout(false);
                  setWarningReason(null);
                }}
                className="cursor-pointer rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-white/20"
              >
                {"Ko'rishga qaytish"}
              </button>
              {onUnlockClick ? (
                <button
                  type="button"
                  onClick={onUnlockClick}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-2 text-xs font-black text-slate-950 shadow-lg hover:brightness-105"
                >
                  {"🔓 To'lov qilib toza CV olish"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
