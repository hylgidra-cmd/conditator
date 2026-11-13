"use client";

import { useState } from "react";
import { postJson } from "@/backend/client/api";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

type Props = {
  vacancyId: string;
  studentCvs: { id: string; title: string; savedAt: string | null }[];
  alreadyApplied: boolean;
  applicationStatus?: string | null;
  conversationId?: string | null;
};

export function ApplyModal({
  vacancyId,
  studentCvs,
  alreadyApplied,
  applicationStatus,
  conversationId,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState(studentCvs[0]?.id || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(alreadyApplied);

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
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="font-bold text-green-700">Ariza yuborilgan</h4>
            <p className="text-muted text-xs">
              Holat: {applicationStatus ?? "Ko'rib chiqilmoqda"}
            </p>
          </div>
        </div>
        {conversationId ? (
          <Link
            href={`/chat?id=${conversationId}`}
            className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:opacity-95"
          >
            Suhbatga o&apos;tish 💬
          </Link>
        ) : (
          <span className="text-muted text-xs font-medium">
            Kompaniya CV ingizni ko&apos;rib chiqqach suhbat ochiladi
          </span>
        )}
      </div>
    );
  }

  if (studentCvs.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div>
          <h4 className="font-bold">Rezyume mavjud emas</h4>
          <p className="text-muted text-xs">
            Ushbu vakansiyaga ariza yuborish uchun avval rezyume yarating.
          </p>
        </div>
        <Link
          href="/student/cv"
          className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-sm font-semibold transition-colors hover:opacity-95"
        >
          Rezyume yaratish ✨
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-brand text-brand-foreground w-full rounded-2xl py-3.5 text-base font-bold shadow-md transition-all hover:opacity-95 hover:shadow-lg sm:w-auto sm:px-8"
      >
        Ariza yuborish (Rezyumeni jo&apos;natish) 🚀
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border-border w-full max-w-lg space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Vakansiyaga ariza topshirish
                </h3>
                <p className="text-muted mt-1 text-xs">
                  Rezyumeyingiz va qisqa xabaringiz
                  to&apos;g&apos;ridan-to&apos;g&apos;ri ish beruvchining
                  shaxsiy kabinetiga yuboriladi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Select CV */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Qaysi rezyumeyingizni yuborasiz?
                </label>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="border-border focus:border-brand bg-surface w-full rounded-xl border p-3 text-sm font-medium outline-none focus:ring-2"
                >
                  {studentCvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title || "Mening rezyumem"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note / Initial message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Xabar (Qo&apos;shimcha ma&apos;lumot):
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Assalomu alaykum! Vakansiya talablari bilan tanishib chiqdim va jamoangizga qo'shilishdan mamnun bo'laman..."
                  className="border-border focus:border-brand bg-surface w-full rounded-xl border p-3 text-sm outline-none focus:ring-2"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand text-brand-foreground rounded-xl px-6 py-2.5 text-sm font-bold shadow hover:opacity-95 disabled:opacity-60"
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
