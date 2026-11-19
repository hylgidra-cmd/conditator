"use client";

import { type ChangeEvent, useState } from "react";
import { postJson } from "@/backend/client/api";
import { CheckIcon, SendIcon } from "@/frontend/components/icons";
import { compressImageForUpload } from "@/frontend/lib/compress-image";
import { Link } from "@/i18n/navigation";

const CARD_DISPLAY = "9860 1301 6978 8069";
const CARD_DIGITS = "9860130169788069";
const CARD_HOLDER = "GULGINA E.";

const MANUAL_PAY_ERRORS: Record<string, string> = {
  INVALID_RECEIPT_IMAGE: "Rasm formati qo'llab-quvvatlanmadi. JPG, PNG yoki WebP skrinshot yuklang.",
  FILE_TYPE_NOT_ALLOWED: "Faqat rasm (JPG, PNG, WebP) yuklash mumkin.",
  PAYLOAD_TOO_LARGE: "Rasm hajmi juda katta. Qaytadan tanlang.",
  RATE_LIMITED: "Juda ko'p urinish. Biroz kutib qaytadan yuboring.",
  NOT_FOUND: "CV topilmadi. Sahifani yangilab qayta urinib ko'ring.",
  FORBIDDEN: "Ushbu amal uchun ruxsat yetarli emas.",
};

type PaymentPurposeType =
  | "CV_CREATION"
  | "WEEKLY_APPLY_PASS"
  | "VACANCY_UNLOCK";

type Props = {
  purpose: PaymentPurposeType;
  amountUzs: number;
  planId?: string;
  cvId?: string;
  vacancyId?: string;
  title?: string;
  description?: string;
  onSubmitted?: () => void;
};

export function ManualCardPaymentBox({
  purpose,
  amountUzs,
  planId,
  cvId,
  vacancyId,
  title,
  description,
  onSubmitted,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCompanyPlan = purpose === "VACANCY_UNLOCK";
  const isWeeklyPass = purpose === "WEEKLY_APPLY_PASS";
  const submittedText = isCompanyPlan
    ? "Chek rasmi Qo'llab-quvvatlash bo'limiga va Admin panelga yuborildi. Administrator «Qabul qilindi» tugmasini bosishi bilan Kompaniya Obunasi darhol faollashadi va barcha CV kontaktlari hamda PDF lar ochiladi."
    : isWeeklyPass
      ? "Chek rasmi Qo'llab-quvvatlash bo'limiga va Admin panelga yuborildi. Administrator «Qabul qilindi» tugmasini bosishi bilan 7 kunlik ariza yuborish ruxsatnomasi darhol faollashadi."
      : "Chek rasmi Qo'llab-quvvatlash bo'limiga va Admin panelga yuborildi. Administrator «Qabul qilindi» tugmasini bosishi bilan CV darhol faollashadi hamda skrinshot cheklovi olib tashlanadi.";
  const hintText = isCompanyPlan
    ? "Admin «Qabul qilindi» tugmasini bosishi bilan tanlangan obuna muddati darhol faollashadi."
    : isWeeklyPass
      ? "Admin «Qabul qilindi» tugmasini bosishi bilan 7 kunlik ariza yuborish ruxsatnomasi darhol faollashadi."
      : "Admin «Qabul qilindi» tugmasini bosishi bilan CV va toza PDF/DOCX yuklab olish darhol faollashadi.";

  async function handleCopyCard() {
    try {
      await navigator.clipboard.writeText(CARD_DIGITS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageForUpload(file);
      setReceiptDataUrl(compressed);
      setReceiptName(file.name || "chek.jpg");
    } catch {
      setError("Rasmni o'qishda xatolik yuz berdi. Iltimos, skrinshot (JPG/PNG) tanlang.");
    }
  }

  async function handleSubmitReceipt() {
    if (!receiptDataUrl) {
      setError("Avval to'lov cheki (skrinshot) rasmini yuklang.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await postJson<{
        ok: boolean;
        paymentId: string;
        externalId: string;
      }>("/api/payments/manual-submit", {
        purpose,
        ...(planId ? { planId } : {}),
        ...(cvId ? { cvId } : {}),
        ...(vacancyId ? { vacancyId } : {}),
        receiptDataUrl,
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      if (!res.ok) {
        setError(
          (res.error && MANUAL_PAY_ERRORS[res.error]) ||
            "Chekni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
        );
        setSubmitting(false);
        return;
      }

      setSubmittedCode(res.data.externalId);
      setSubmitting(false);
      onSubmitted?.();
    } catch {
      setError("Tarmoq xatoligi. Qaytadan urinib ko'ring.");
      setSubmitting(false);
    }
  }

  if (submittedCode) {
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-left shadow-sm">
        <div className="flex items-start gap-3.5">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <CheckIcon size={20} />
          </span>
          <div className="space-y-1.5">
            <h4 className="text-text text-base font-black">
              {`To'lov cheki yuborildi (#${submittedCode})`}
            </h4>
            <p className="text-subtle text-xs leading-relaxed sm:text-sm">
              {submittedText}
            </p>
            <div className="pt-2">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span>{"Qo'llab-quvvatlash chatida ko'rish →"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title || description ? (
        <div className="space-y-1">
          {title ? (
            <h4 className="text-text text-base font-black">{title}</h4>
          ) : null}
          {description ? (
            <p className="text-subtle text-xs leading-relaxed">{description}</p>
          ) : null}
        </div>
      ) : null}

      {/* 16-Digit Bank Card Visual */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-[#041410] via-[#07261E] to-[#0D9488] p-5 text-white shadow-[0_18px_45px_-12px_rgb(4,20,16,0.55)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-emerald-400/20 blur-2xl"
        />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="rounded-full border border-emerald-300/30 bg-white/10 px-3 py-0.5 text-[11px] font-extrabold tracking-wider text-emerald-200 uppercase">
            {"Karta orqali to'lov (HUMO / UZCARD)"}
          </span>
          <span className="rounded-xl bg-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow-xs">
            {`${amountUzs.toLocaleString("en-US")} so'm`}
          </span>
        </div>

        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/25 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-emerald-200/75 uppercase">
              {"16 xonali karta raqami"}
            </p>
            <p className="mt-0.5 font-mono text-base font-black tracking-normal text-white sm:text-xl sm:tracking-wider">
              {CARD_DISPLAY}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCard}
            className="cursor-pointer rounded-xl border border-white/20 bg-white/15 px-3.5 py-2 text-xs font-extrabold text-white transition-all hover:bg-white/25 active:scale-95"
          >
            {copied ? "✓ Nusxalandi" : "Nusxalash"}
          </button>
        </div>

        <div className="relative z-10 mt-3 flex items-center justify-between text-xs">
          <span className="text-emerald-100/80">
            {`Karta egasi: `}
            <strong className="font-black text-white">{CARD_HOLDER}</strong>
          </span>
          <span className="font-bold text-emerald-200">
            {`To'lov: ${amountUzs.toLocaleString("en-US")} UZS`}
          </span>
        </div>
      </div>

      {/* Receipt Image Upload + Auto Support Forward */}
      <div className="border-line bg-card-cool/80 space-y-3 rounded-2xl border p-4">
        <div className="space-y-1">
          <p className="text-text text-xs font-extrabold">
            {
              "To'lov cheki (skrinshot) rasmini yuklang — u avtomatik Qo'llab-quvvatlash va Admin panelga yuboriladi:"
            }
          </p>
          <p className="text-subtle text-[11px]">{hintText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="border-primary/40 bg-card text-primary-text hover:border-primary inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold shadow-2xs transition-all hover:-translate-y-0.5">
            <span>{"📷 Chek rasmini tanlash"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {receiptName ? (
            <span className="text-subtle truncate text-xs font-semibold">
              {receiptName}
            </span>
          ) : null}
        </div>

        {receiptDataUrl ? (
          <div className="flex items-center gap-3 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptDataUrl}
              alt="Receipt preview"
              className="border-line h-20 w-20 rounded-xl border object-cover shadow-xs"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qo'shimcha izoh (ixtiyoriy)..."
              className="border-line bg-card text-text placeholder:text-subtle focus:border-primary flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-danger text-xs font-bold">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleSubmitReceipt}
          disabled={submitting || !receiptDataUrl}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-5 py-3 text-xs font-black text-white shadow-[0_10px_25px_-6px_rgb(5,150,105,0.55)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          <SendIcon size={15} />
          <span>
            {submitting
              ? "Yuborilmoqda..."
              : "To'lov chekini Adminga va Qo'llab-quvvatlashga yuborish"}
          </span>
        </button>
      </div>
    </div>
  );
}
