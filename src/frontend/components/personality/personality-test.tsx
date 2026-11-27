"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/backend/format-date";
import { useRouter } from "@/i18n/navigation";
import type {
  ClientQuestionItem,
  PublicPersonalityProfile,
} from "@/backend/personality/service";

type Lang = "kk" | "uz" | "ru" | "en";

type ActiveAttempt = {
  id: string;
  startedAt: string;
  totalQuestions: number;
  questions: ClientQuestionItem[];
  answers: Record<string, string>;
};

const copy = {
  uz: {
    badge: "Shaxsiyat testi",
    introTitle: "O'zingizning kuchli tomonlaringizni kashf eting",
    introDesc:
      "{count} ta savol, taxminan 5 daqiqa. To'g'ri yoki noto'g'ri javob yo'q — o'zingizga eng yaqin variantni tanlang.",
    startBtn: "Boshlash",
    resumeBtn: "Davom ettirish",
    starting: "Tayyorlanmoqda...",
    back: "Orqaga",
    next: "Keyingi",
    seeResult: "Natijani ko'rish",
    calculating: "Hisoblanmoqda...",
    consent:
      "Javoblarim va natijam Candidator profilim va CV hujjatimda ko'rsatilishiga roziman.",
    incomplete: "Barcha savollarga javob bering va rozilikni belgilang.",
    error: "Xatolik yuz berdi. Qayta urinib ko'ring.",
    resultBadge: "Sizning shaxsiyat profilingiz",
    strengthsTitle: "Qaysi ishlarda kuchli",
    scalesTitle: "5 ta asosiy xususiyatingiz",
    continueCv: "CV yaratishga o'tish",
    retake: "Testni qayta topshirish",
    retakeWait: "Qayta topshirish {days} kundan keyin mumkin.",
    delete: "Natijani o'chirish",
    deleteConfirm:
      "Natijani o'chirasizmi? CVlar saqlanadi, ammo yangi natija uchun testni qayta topshirish kerak bo'ladi.",
    testDateLabel: "Test sanasi",
    choiceHint: "Sizga yaqinroq variantni tanlang",
  },
  kk: {
    badge: "Jeke qásiyet testi",
    introTitle: "Ózińizdiń kúshli táreplerińizdi ashıń",
    introDesc:
      "{count} soraw, shama menen 5 minut. Durıs yamasa nadurıs juwap joq — ózińizge eń jaqın varianttı tańlań.",
    startBtn: "Baslaw",
    resumeBtn: "Dawam ettiriw",
    starting: "Tayarlanbaqta...",
    back: "Artqa",
    next: "Keyingi",
    seeResult: "Nátiyjeni kóriw",
    calculating: "Esaplanbaqta...",
    consent:
      "Juwaplarım hám nátiyjem Candidator profilim hám CV hújjetimde kórsetiliwine razıman.",
    incomplete: "Barlıq sorawlarǵa juwap beriń hám razılıqtı belgileń.",
    error: "Qátelik júz berdi. Qayta urınıp kóriń.",
    resultBadge: "Sizdiń jeke qásiyet profilińiz",
    strengthsTitle: "Qaysı jumıslarda kúshli",
    scalesTitle: "5 tiykarǵı ózgesheligińiz",
    continueCv: "CV jaratıwǵa ótiw",
    retake: "Testti qayta tapsırıw",
    retakeWait: "Qayta tapsırıw {days} kúnnen keyin múmkin.",
    delete: "Nátiyjeni óshiriw",
    deleteConfirm:
      "Nátiyjeni óshiresiz be? CVlar saqlanadı, biraq jańa nátiyje ushın testti qayta tapsırıw kerek boladı.",
    testDateLabel: "Test sánesi",
    choiceHint: "Ózińizge jaqınıraq varianttı tańlań",
  },
  ru: {
    badge: "Тест личности",
    introTitle: "Узнайте свои сильные стороны",
    introDesc:
      "{count} вопросов, около 5 минут. Правильных или неправильных ответов нет — выбирайте самый близкий вариант.",
    startBtn: "Начать",
    resumeBtn: "Продолжить",
    starting: "Подготовка...",
    back: "Назад",
    next: "Далее",
    seeResult: "Посмотреть результат",
    calculating: "Подсчёт...",
    consent:
      "Я согласен на сохранение результатов и отображение блока «Личность» в моём CV на Candidator.",
    incomplete: "Ответьте на все вопросы и подтвердите согласие.",
    error: "Произошла ошибка. Попробуйте ещё раз.",
    resultBadge: "Ваш профиль личности",
    strengthsTitle: "В каких задачах силён",
    scalesTitle: "5 ключевых качеств",
    continueCv: "Перейти к CV",
    retake: "Пройти тест снова",
    retakeWait: "Повторное прохождение доступно через {days} дней.",
    delete: "Удалить результат",
    deleteConfirm:
      "Удалить результат? CV сохранятся, но для нового профиля нужно пройти тест повторно.",
    testDateLabel: "Дата теста",
    choiceHint: "Выберите более близкий вам вариант",
  },
  en: {
    badge: "Personality test",
    introTitle: "Discover your core strengths",
    introDesc:
      "{count} questions, about 5 minutes. There are no right or wrong answers — pick what feels closest to you.",
    startBtn: "Start",
    resumeBtn: "Continue",
    starting: "Preparing...",
    back: "Back",
    next: "Next",
    seeResult: "See result",
    calculating: "Calculating...",
    consent:
      "I agree to save my results and show the Personality section on my Candidator CV.",
    incomplete: "Please answer all questions and confirm consent.",
    error: "Something went wrong. Please try again.",
    resultBadge: "Your personality profile",
    strengthsTitle: "Where you shine",
    scalesTitle: "Your 5 core traits",
    continueCv: "Go to CV builder",
    retake: "Retake test",
    retakeWait: "You can retake the test after {days} days.",
    delete: "Delete result",
    deleteConfirm:
      "Delete your result? Your CVs stay saved, but you will need to retake the test for a new profile.",
    testDateLabel: "Test date",
    choiceHint: "Choose the option closer to you",
  },
} as const;

function firstUnansweredIndex(attempt: ActiveAttempt): number {
  const idx = attempt.questions.findIndex((q) => !attempt.answers[q.id]);
  return idx === -1 ? Math.max(0, attempt.questions.length - 1) : idx;
}

export function PersonalityTest({
  locale,
  initialAttempt,
  initialResult,
  retakeDays,
  questionsPerTest,
}: {
  locale: Lang;
  initialAttempt: ActiveAttempt | null;
  initialResult: PublicPersonalityProfile | null;
  retakeDays: number;
  questionsPerTest: number;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(initialAttempt);
  const [result, setResult] = useState<PublicPersonalityProfile | null>(
    initialResult,
  );
  const [index, setIndex] = useState<number>(() =>
    initialAttempt ? firstUnansweredIndex(initialAttempt) : 0,
  );
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retaking, setRetaking] = useState(false);
  const [canRetake, setCanRetake] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanRetake(
      !result ||
        Date.now() - new Date(result.createdAt).getTime() >=
          retakeDays * 86400000,
    );
  }, [result, retakeDays]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  async function startAttempt() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/personality/attempts?locale=${locale}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("start failed");
      const data = (await response.json()) as { attempt: ActiveAttempt };
      setAttempt(data.attempt);
      setIndex(firstUnansweredIndex(data.attempt));
      setRetaking(true);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(questionId: string, answerKey: string) {
    if (!attempt || busy) return;
    setError("");
    const nextAnswers = { ...attempt.answers, [questionId]: answerKey };
    setAttempt({ ...attempt, answers: nextAnswers });

    // Har javob darhol serverga saqlanadi
    void fetch(`/api/personality/attempts/${attempt.id}/answers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: { [questionId]: answerKey } }),
    })
      .then((res) => {
        if (!res.ok) setError(t.error);
      })
      .catch(() => {
        setError(t.error);
      });

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (index < attempt.questions.length - 1) {
      advanceTimerRef.current = setTimeout(() => {
        setIndex((cur) => Math.min(attempt.questions.length - 1, cur + 1));
      }, 300);
    }
  }

  async function handleFinish() {
    if (!attempt) return;
    const allAnswered = attempt.questions.every((q) =>
      Boolean(attempt.answers[q.id]),
    );
    if (!allAnswered || !consent) {
      setError(t.incomplete);
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Yakunlashdan oldin barcha javoblar saqlanganiga ishonch hosil qilamiz
      const saveRes = await fetch(
        `/api/personality/attempts/${attempt.id}/answers`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: attempt.answers }),
        },
      );
      if (!saveRes.ok) throw new Error("save answers failed");
      const response = await fetch(
        `/api/personality/attempts/${attempt.id}/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent: true, locale }),
        },
      );
      if (!response.ok) throw new Error("finish failed");
      const data = (await response.json()) as {
        result: PublicPersonalityProfile;
      };
      setResult(data.result);
      setAttempt(null);
      setRetaking(false);
      router.refresh();
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t.deleteConfirm)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/personality/me", { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      setResult(null);
      setAttempt(null);
      setRetaking(false);
      setIndex(0);
      router.refresh();
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  // 1. Natija ekrani (agar faol test ketmayotgan bo'lsa va natija bor bo'lsa)
  if (result && !attempt && !retaking) {
    const formattedDate = formatDate(result.createdAt);

    return (
      <main className="page-x mx-auto max-w-4xl space-y-6 py-8 sm:py-12">
        <header className="border-line bg-card shadow-soft rounded-3xl border p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-primary-soft text-primary-text inline-flex rounded-full px-3.5 py-1 text-xs font-bold">
              {t.resultBadge}
            </span>
            <span className="border-line bg-canvas text-subtle inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
              {result.groupName}
            </span>
          </div>
          <h1 className="text-text mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {result.typeName}
          </h1>
          <p className="text-subtle mt-1 text-sm font-medium">
            {result.groupSummary}
          </p>
          <p className="text-text/90 mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            {result.description}
          </p>
          {result.strengths && (
            <div className="bg-primary-soft/50 border-primary/20 mt-5 rounded-2xl border px-4 py-3.5">
              <p className="text-primary-text text-xs font-bold tracking-wide uppercase">
                {t.strengthsTitle}
              </p>
              <p className="text-text mt-1 text-sm font-semibold">
                {result.strengths}
              </p>
            </div>
          )}
          <p className="text-subtle mt-4 text-xs">
            {t.testDateLabel}: {formattedDate}
          </p>
        </header>

        <section className="border-line bg-card shadow-soft space-y-4 rounded-3xl border p-6 sm:p-8">
          <h2 className="text-text text-lg font-extrabold">{t.scalesTitle}</h2>
          <div className="space-y-4">
            {result.scales.map((bar) => (
              <div
                key={bar.key}
                className="border-line bg-canvas/60 rounded-2xl border p-4"
              >
                <div className="mb-2.5 flex items-center justify-between gap-4 text-xs font-semibold sm:text-sm">
                  <span
                    className={
                      bar.leftPct >= bar.rightPct
                        ? "text-primary-text font-bold"
                        : "text-subtle"
                    }
                  >
                    {bar.leftLabel}
                  </span>
                  <span
                    className={
                      bar.rightPct > bar.leftPct
                        ? "text-primary-text text-right font-bold"
                        : "text-subtle text-right"
                    }
                  >
                    {bar.rightLabel}
                  </span>
                </div>
                <div className="bg-line relative h-2.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary/25 absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${bar.rightPct}%` }}
                  />
                  <div
                    className="bg-primary border-card absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm transition-all"
                    style={{
                      left: `${Math.max(4, Math.min(96, bar.rightPct))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
            onClick={() => router.push("/student/cv")}
          >
            {t.continueCv}
          </button>
          {canRetake && (
            <button
              className="border-primary text-primary-text hover:bg-primary-soft rounded-xl border px-5 py-3 text-sm font-bold transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={startAttempt}
            >
              {busy ? t.starting : t.retake}
            </button>
          )}
          <button
            className="border-line text-subtle hover:text-text rounded-xl border px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={busy}
            onClick={handleDelete}
          >
            {t.delete}
          </button>
        </div>

        {!canRetake && (
          <p className="text-subtle text-xs sm:text-sm">
            {t.retakeWait.replace("{days}", String(retakeDays))}
          </p>
        )}
      </main>
    );
  }

  // 2. Boshlash (intro) ekrani
  if (!attempt) {
    return (
      <main className="page-x mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center py-8">
        <div className="border-line bg-card shadow-soft w-full rounded-3xl border p-7 text-center sm:p-10">
          <span className="bg-primary-soft text-primary-text inline-flex rounded-full px-3.5 py-1 text-xs font-bold">
            {t.badge}
          </span>
          <h1 className="text-text mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
            {t.introTitle}
          </h1>
          <p className="text-subtle mx-auto mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
            {t.introDesc.replace("{count}", String(questionsPerTest))}
          </p>
          {error && (
            <p className="mt-4 text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            className="bg-primary text-on-primary mt-7 inline-flex min-w-44 items-center justify-center rounded-2xl px-7 py-3.5 text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={busy}
            onClick={startAttempt}
          >
            {busy ? t.starting : t.startBtn}
          </button>
        </div>
      </main>
    );
  }

  // 3. Bir ekranda bitta savol (telefonda aylantirishsiz sig'adi)
  const total = attempt.questions.length;
  const current = attempt.questions[index];
  const selectedKey = current ? attempt.answers[current.id] : undefined;
  const answeredCount = attempt.questions.filter((q) =>
    Boolean(attempt.answers[q.id]),
  ).length;
  const isLast = index === total - 1;
  const allAnswered = answeredCount === total;
  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <main className="page-x mx-auto flex min-h-[calc(100svh-5rem)] max-w-2xl flex-col justify-between py-4 sm:py-8">
      {/* Tepada jarayon chizig'i */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold sm:text-sm">
          <span className="text-primary-text">{t.badge}</span>
          <span className="text-text tabular-nums">
            {index + 1} / {total}
          </span>
        </div>
        <div className="bg-line h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* O'rtada bitta savol va javob tugmalari */}
      {current && (
        <section className="border-line bg-card shadow-soft my-auto rounded-3xl border p-5 sm:p-8">
          {current.type === "CHOICE" && (
            <p className="text-primary-text mb-2 text-xs font-bold tracking-wide uppercase">
              {t.choiceHint}
            </p>
          )}
          <h1 className="text-text text-xl leading-snug font-extrabold sm:text-2xl">
            {current.text}
          </h1>

          {current.type === "CHOICE" ? (
            <div className="mt-5 grid gap-3">
              {current.options.map((opt) => {
                const active = selectedKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelect(current.id, opt.key)}
                    className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-primary bg-primary text-on-primary shadow-sm"
                        : "border-line bg-canvas text-text hover:border-primary/60"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-primary-soft text-primary-text"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm leading-snug font-semibold sm:text-base">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 grid gap-2.5">
              {current.options.map((opt) => {
                const active = selectedKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSelect(current.id, opt.key)}
                    className={`flex min-h-12 w-full items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-bold transition-all sm:text-base ${
                      active
                        ? "border-primary bg-primary text-on-primary shadow-sm"
                        : "border-line bg-canvas text-text hover:border-primary/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {isLast && (
            <div className="border-line mt-5 space-y-3 border-t pt-4">
              <label className="text-subtle flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed sm:text-sm">
                <input
                  className="accent-primary mt-0.5 h-4 w-4 shrink-0"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{t.consent}</span>
              </label>
              <button
                type="button"
                disabled={busy || !allAnswered || !consent}
                onClick={handleFinish}
                className="bg-primary text-on-primary w-full rounded-2xl px-6 py-3.5 text-base font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t.calculating : t.seeResult}
              </button>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {/* Pastda Orqaga / Keyingi navigatsiya */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <button
          type="button"
          disabled={index === 0 || busy}
          onClick={() => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
            setIndex((cur) => Math.max(0, cur - 1));
          }}
          className="border-line bg-card text-text hover:border-primary rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-40"
        >
          {t.back}
        </button>
        {!isLast && selectedKey && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (advanceTimerRef.current)
                clearTimeout(advanceTimerRef.current);
              setIndex((cur) => Math.min(total - 1, cur + 1));
            }}
            className="bg-primary text-on-primary rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
          >
            {t.next}
          </button>
        )}
      </div>
    </main>
  );
}
