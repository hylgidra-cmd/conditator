"use client";

import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

type Props = {
  vacancyId: string;
  studentCvs: {
    id: string;
    title: string;
    savedAt: string | null;
    isPaid?: boolean;
  }[];
  alreadyApplied: boolean;
  applicationStatus?: string | null;
  conversationId?: string | null;
  canApply: boolean;
  hasActivePass: boolean;
  freeTrialAvailable: boolean;
  applyPassUntil?: string | null;
};

export function ApplyModal({
  vacancyId,
  studentCvs,
  alreadyApplied,
  applicationStatus,
  conversationId,
  canApply,
  hasActivePass,
  applyPassUntil,
}: Props) {
  const router = useRouter();
  const paidCvs = studentCvs.filter((c) => c.isPaid !== false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState(
    paidCvs[0]?.id || studentCvs[0]?.id || "",
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState<"CLICK" | "PAYME" | "TEST" | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(alreadyApplied);

  async function handleCheckout(
    purpose: "CV_CREATION" | "WEEKLY_APPLY_PASS",
    provider: "CLICK" | "PAYME" | "TEST",
    cvId?: string,
  ) {
    if (paying) return;
    setPaying(provider);
    setError(undefined);
    try {
      const res = await postJson<{ paymentId: string; redirectUrl: string }>(
        "/api/payments/checkout",
        {
          purpose,
          provider,
          ...(cvId ? { cvId } : {}),
          returnUrl: `${window.location.pathname}${window.location.search}`,
        },
      );
      if (res.ok && res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
        return;
      }
      setError("To'lovni boshlashda xatolik yuz berdi");
    } catch {
      setError("To'lovni boshlashda xatolik yuz berdi");
    } finally {
      setPaying(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCvId) {
      setError("Iltimos, rezyumeni tanlang");
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      const res = await postJson<{ ok: boolean }>(
        `/api/vacancies/${vacancyId}/apply`,
        {
          cvId: selectedCvId,
          note: note.trim() || undefined,
        },
      );

      if (res.ok) {
        setSuccess(true);
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Ariza yuborishda xatolik yuz berdi");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border-line bg-card/90 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="text-success font-bold">Ariza yuborilgan</h4>
            <p className="text-subtle text-xs">
              Holat: {applicationStatus ?? "Ko'rib chiqilmoqda"}
            </p>
          </div>
        </div>
        {conversationId ? (
          <Link
            href={`/chat?id=${conversationId}`}
            className="bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:opacity-95"
          >
            Suhbatga o&apos;tish 💬
          </Link>
        ) : (
          <span className="text-subtle text-xs font-medium">
            Kompaniya CV ingizni ko&apos;rib chiqqach suhbat ochiladi
          </span>
        )}
      </div>
    );
  }

  if (studentCvs.length === 0) {
    return (
      <div className="border-line bg-card/90 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div>
          <h4 className="text-text font-bold">Rezyume mavjud emas</h4>
          <p className="text-subtle text-xs">
            Ushbu vakansiyaga ariza yuborish uchun avval rezyume yarating va
            faollashtiring (5 000 so&apos;m).
          </p>
        </div>
        <Link
          href="/student/cv"
          className="bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:opacity-95"
        >
          Rezyume yaratish ✨
        </Link>
      </div>
    );
  }

  if (paidCvs.length === 0) {
    const unpaidCvId = studentCvs[0]?.id;
    return (
      <div className="border-primary/35 bg-primary-soft/80 rounded-2xl border p-5 shadow-sm backdrop-blur-md">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-text font-extrabold">
              🔒 Avval CV ni faollashtirish to&apos;lovi kerak (5 000 so&apos;m)
            </h4>
            <p className="text-subtle text-xs leading-relaxed">
              Rezyumengiz yaratilgan, lekin undan foydalanish va vakansiyalarga
              ariza yuborish uchun avval 5 000 so&apos;m CV to&apos;lovini
              amalga oshiring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCheckout("CV_CREATION", "CLICK", unpaidCvId)}
              disabled={Boolean(paying)}
              className="rounded-xl bg-[#00AEEF] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paying === "CLICK" ? "Yuklanmoqda…" : "Click — 5 000 so'm"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckout("CV_CREATION", "PAYME", unpaidCvId)}
              disabled={Boolean(paying)}
              className="rounded-xl bg-[#00CCCC] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paying === "PAYME" ? "Yuklanmoqda…" : "Payme — 5 000 so'm"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckout("CV_CREATION", "TEST", unpaidCvId)}
              disabled={Boolean(paying)}
              className="border-line bg-card text-text hover:border-primary rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {paying === "TEST" ? "Yuklanmoqda…" : "Test to'lov — 5 000 so'm"}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-danger mt-2 text-xs font-medium">{error}</p>
        )}
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="border-primary/35 bg-primary-soft/80 rounded-2xl border p-5 shadow-sm backdrop-blur-md">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-text font-extrabold">
              🔒 Ariza yuborish uchun oldindan 5 000 so&apos;m to&apos;lov kerak
            </h4>
            <p className="text-subtle text-xs leading-relaxed">
              Vakansiyalarga ariza topshirish va ishlashni davom ettirish uchun
              oldindan 5 000 so&apos;m (7 kunlik ruxsat) to&apos;lang.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCheckout("WEEKLY_APPLY_PASS", "CLICK")}
              disabled={Boolean(paying)}
              className="rounded-xl bg-[#00AEEF] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paying === "CLICK" ? "Yuklanmoqda…" : "Click — 5 000 so'm"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckout("WEEKLY_APPLY_PASS", "PAYME")}
              disabled={Boolean(paying)}
              className="rounded-xl bg-[#00CCCC] px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {paying === "PAYME" ? "Yuklanmoqda…" : "Payme — 5 000 so'm"}
            </button>
            <button
              type="button"
              onClick={() => handleCheckout("WEEKLY_APPLY_PASS", "TEST")}
              disabled={Boolean(paying)}
              className="border-line bg-card text-text hover:border-primary rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {paying === "TEST" ? "Yuklanmoqda…" : "Test to'lov — 5 000 so'm"}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-danger mt-2 text-xs font-medium">{error}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover w-full rounded-2xl py-3.5 text-base font-bold transition-all sm:w-auto sm:px-8"
        >
          Ariza yuborish (Rezyumeni jo&apos;natish) 🚀
        </button>
        <span className="text-subtle text-xs font-medium">
          {hasActivePass && applyPassUntil
            ? `✅ Ruxsat faol: ${new Date(applyPassUntil).toLocaleDateString()} gacha`
            : ""}
        </span>
      </div>

      {isOpen && (
        <div
          className="ds-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="ds-modal-panel bg-card border-line shadow-float w-full max-w-lg space-y-4 rounded-3xl border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-text text-xl font-bold">
                  Vakansiyaga ariza topshirish
                </h3>
                <p className="text-subtle mt-1 text-xs">
                  Rezyumeyingiz va qisqa xabaringiz
                  to&apos;g&apos;ridan-to&apos;g&apos;ri ish beruvchining
                  shaxsiy kabinetiga yuboriladi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-subtle hover:text-text text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Select CV */}
              <div className="space-y-1.5">
                <label className="text-subtle text-xs font-semibold tracking-wider uppercase">
                  Qaysi rezyumeyingizni yuborasiz?
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="border-line focus:border-primary bg-canvas text-text w-full rounded-xl border p-3 text-sm font-medium outline-none focus:ring-2"
                >
                  {paidCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title || "Mening rezyumem"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note / Initial message */}
              <div className="space-y-1.5">
                <label className="text-subtle text-xs font-semibold tracking-wider uppercase">
                  Xabar (Qo&apos;shimcha ma&apos;lumot):
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Assalomu alaykum! Vakansiya talablari bilan tanishib chiqdim va jamoangizga qo'shilishdan mamnun bo'laman..."
                  className="border-line focus:border-primary bg-canvas text-text w-full rounded-xl border p-3 text-sm outline-none focus:ring-2"
                />
              </div>

              {error && (
                <p className="border-red-500/30 bg-danger-soft text-danger rounded-xl border p-3 text-sm font-medium">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-subtle hover:bg-card-cool hover:text-text rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {submitting ? "Yuborilmoqda…" : "Yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
