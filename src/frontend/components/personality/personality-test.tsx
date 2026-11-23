"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

type Lang = "kk" | "uz" | "ru" | "en";
type Result = {
  typeCode: string;
  identity: string;
  mindPct: number;
  energyPct: number;
  naturePct: number;
  tacticsPct: number;
  identityPct: number;
  createdAt: string;
};

const copy = {
  uz: {
    title: "Shaxsiyat testi",
    intro:
      "60 ta fikrga o'zingizga mos javobni tanlang. Bu kasbga yaroqlilik hukmi emas.",
    progress: "Javob berilgan",
    section: "Bo‘lim",
    scaleLow: "Umuman qo‘shilmayman",
    scaleMiddle: "Betarafman",
    scaleHigh: "To‘liq qo‘shilaman",
    pageComplete: "Bu bo‘limdagi barcha savollarga javob berildi",
    previous: "Oldingi",
    next: "Keyingi",
    save: "Saqlash",
    finish: "Natijani hisoblash",
    consent:
      "Javoblarim va natijam Candidator'da saqlanishiga, admin toifalash uchun ko'rishiga roziman.",
    incomplete: "Barcha 60 savolga javob bering va rozilikni belgilang.",
    error: "Xatolik yuz berdi. Qayta urinib ko'ring.",
    saved: "Javoblar saqlandi.",
    result: "Sizning profilingiz",
    continue: "CV yaratishga o'tish",
    delete: "Natijani o'chirish",
    deleteConfirm:
      "Natijani o'chirasizmi? CVlar saqlanadi, ammo yangi CV yaratish uchun testni qayta topshirish kerak bo'ladi.",
    retake: "Qayta topshirish",
    retakeWait: "Qayta topshirish 30 kundan keyin mumkin.",
    labels: ["Muloqot", "Tasavvur", "Qaror", "Reja", "Ishonch"],
  },
  kk: {
    title: "Jeke qásiyet testi",
    intro:
      "60 pikirge ózińizge sáykes juwaptı tańlań. Bul kásipke jaraylılıq húkimi emes.",
    progress: "Juwap berilgen",
    section: "Bólim",
    scaleLow: "Ulıwma qosılmayman",
    scaleMiddle: "Biytárepman",
    scaleHigh: "Tolıq qosılaman",
    pageComplete: "Bul bólimdegi barlıq sorawlarǵa juwap berildi",
    previous: "Aldınǵı",
    next: "Keyingi",
    save: "Saqlaw",
    finish: "Nátiyjeni esaplaw",
    consent:
      "Juwaplarım hám nátiyjem Candidator'da saqlanıwına, admin toparlaw ushın kóriwine razıman.",
    incomplete: "60 sorawdıń bárine juwap beriń hám razılıqtı belgileń.",
    error: "Qátelik júz berdi. Qayta urınıp kóriń.",
    saved: "Juwaplar saqlandı.",
    result: "Sizdiń profilińiz",
    continue: "CV jaratıwǵa ótiw",
    delete: "Nátiyjeni óshiriw",
    deleteConfirm:
      "Nátiyjeni óshiresiz be? CVlar saqlanadı, biraq jańa CV ushın test qayta tapsırıladı.",
    retake: "Qayta tapsırıw",
    retakeWait: "Qayta tapsırıw 30 kúnnen keyin múmkin.",
    labels: ["Qatnas", "Qıyal", "Qarar", "Reje", "Isenim"],
  },
  ru: {
    title: "Тест личности",
    intro:
      "Ответьте на 60 утверждений. Это не заключение о пригодности к профессии.",
    progress: "Ответов",
    section: "Раздел",
    scaleLow: "Совсем не согласен",
    scaleMiddle: "Нейтрально",
    scaleHigh: "Полностью согласен",
    pageComplete: "На все вопросы раздела даны ответы",
    previous: "Назад",
    next: "Далее",
    save: "Сохранить",
    finish: "Получить результат",
    consent:
      "Я согласен на хранение ответов и результата в Candidator и просмотр администратором для группировки.",
    incomplete: "Ответьте на все 60 вопросов и подтвердите согласие.",
    error: "Произошла ошибка. Попробуйте ещё раз.",
    saved: "Ответы сохранены.",
    result: "Ваш профиль",
    continue: "Создать CV",
    delete: "Удалить результат",
    deleteConfirm:
      "Удалить результат? CV сохранятся, но для нового CV потребуется пройти тест снова.",
    retake: "Пройти снова",
    retakeWait: "Повторный тест доступен через 30 дней.",
    labels: ["Общение", "Воображение", "Решения", "Планы", "Уверенность"],
  },
  en: {
    title: "Personality questionnaire",
    intro:
      "Answer 60 statements about yourself. This is not a job suitability verdict.",
    progress: "Answered",
    section: "Section",
    scaleLow: "Strongly disagree",
    scaleMiddle: "Neutral",
    scaleHigh: "Strongly agree",
    pageComplete: "All questions in this section are answered",
    previous: "Previous",
    next: "Next",
    save: "Save",
    finish: "Calculate result",
    consent:
      "I agree that Candidator stores my answers and result and that admins can view them for grouping.",
    incomplete: "Answer all 60 questions and tick consent.",
    error: "Something went wrong. Please retry.",
    saved: "Answers saved.",
    result: "Your profile",
    continue: "Create CV",
    delete: "Delete result",
    deleteConfirm:
      "Delete your result? Existing CVs remain, but a new CV requires another test.",
    retake: "Retake",
    retakeWait: "Retakes are available after 30 days.",
    labels: ["Social", "Ideas", "Decisions", "Plans", "Confidence"],
  },
} as const;

export function PersonalityTest({
  locale,
  questions,
  initialAnswers,
  initialResult,
  retakeDays,
}: {
  locale: Lang;
  questions: Array<{ id: string; text: string }>;
  initialAnswers: Record<string, number>;
  initialResult: Result | null;
  retakeDays: number;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [page, setPage] = useState(0);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState(initialResult);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const answered = Object.keys(answers).length;
  const pageAnswered = questions
    .slice(page * 10, page * 10 + 10)
    .filter((question) => answers[question.id] !== undefined).length;
  const eligible =
    !result ||
    Date.now() - new Date(result.createdAt).getTime() >= retakeDays * 86400000;
  async function saveDraft(next = answers) {
    const response = await fetch("/api/personality/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: next }),
    });
    if (!response.ok) throw new Error("save failed");
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await saveDraft();
      setMessage(t.saved);
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function nextPage() {
    try {
      await saveDraft();
      setPage((value) => Math.min(5, value + 1));
      setMessage("");
    } catch {
      setMessage(t.error);
    }
  }
  async function finish() {
    if (answered !== 60 || !consent) {
      setMessage(t.incomplete);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, consent }),
      });
      if (!response.ok) throw new Error("submit failed");
      const data = (await response.json()) as { result: Result };
      setResult(data.result);
      router.refresh();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm(t.deleteConfirm)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/personality/me", { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      setResult(null);
      setAnswers({});
      setPage(0);
      router.refresh();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  if (result && !eligible)
    return (
      <main className="page-x mx-auto max-w-5xl space-y-6 py-8 sm:py-12">
        <header className="border-line bg-card shadow-soft rounded-3xl border p-6 sm:p-9">
          <span className="bg-primary-soft text-primary-text inline-flex rounded-full px-3 py-1 text-xs font-bold">
            {t.result}
          </span>
          <h1 className="text-text mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {result.typeCode}-{result.identity}
          </h1>
          <p className="text-subtle mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            {t.intro}
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              result.mindPct,
              result.energyPct,
              result.naturePct,
              result.tacticsPct,
              result.identityPct,
            ] as number[]
          ).map((value, index) => (
            <div
              key={index}
              className="border-line bg-card shadow-soft rounded-2xl border p-5"
            >
              <div className="text-text mb-4 flex justify-between gap-3 text-sm font-bold">
                <span>{t.labels[index]}</span>
                <span className="text-primary-text">{value}%</span>
              </div>
              <div className="bg-line h-2.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="bg-primary text-on-primary rounded-xl px-5 py-3 text-sm font-bold"
            onClick={() => router.push("/student/cv")}
          >
            {t.continue}
          </button>
          <button
            className="border-line text-text rounded-xl border px-5 py-3 text-sm font-bold"
            disabled={busy}
            onClick={remove}
          >
            {t.delete}
          </button>
        </div>
        <p className="text-subtle text-sm">
          {t.retakeWait.replace("30", String(retakeDays))}
        </p>
      </main>
    );
  return (
    <main className="page-x mx-auto max-w-6xl space-y-7 py-8 sm:py-12">
      <header className="border-line bg-card shadow-soft relative overflow-hidden rounded-3xl border p-6 sm:p-9">
        <div className="bg-primary/8 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="bg-primary-soft text-primary-text inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide">
              {t.section} {page + 1} / 6
            </span>
            <h1 className="text-text text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="text-subtle max-w-xl text-sm leading-relaxed sm:text-base">
              {t.intro}
            </p>
          </div>
          <div className="border-primary/20 bg-primary-soft/60 flex min-w-32 flex-col rounded-2xl border px-5 py-4 text-center">
            <span className="text-primary-text text-2xl font-extrabold">
              {answered}
              <span className="text-base font-medium"> / 60</span>
            </span>
            <span className="text-subtle text-xs font-semibold">
              {t.progress}
            </span>
          </div>
        </div>
        <div className="bg-line relative mt-7 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${(answered / 60) * 100}%` }}
          />
        </div>
      </header>

      <div className="border-line bg-card/80 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold sm:px-6">
        <span className="text-subtle">{t.scaleLow}</span>
        <span className="text-subtle">{t.scaleMiddle}</span>
        <span className="text-primary-text">{t.scaleHigh}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {questions.slice(page * 10, page * 10 + 10).map((question, index) => (
          <fieldset
            key={question.id}
            className={`bg-card shadow-soft rounded-2xl border p-5 transition-colors sm:p-6 ${
              answers[question.id] === undefined
                ? "border-line"
                : "border-primary/40"
            }`}
          >
            <legend className="sr-only">{question.text}</legend>
            <div className="mb-5 flex items-start gap-3">
              <span className="bg-primary-soft text-primary-text flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold">
                {page * 10 + index + 1}
              </span>
              <p className="text-text min-h-12 pt-1 text-sm leading-relaxed font-semibold sm:text-base">
                {question.text}
              </p>
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {[-3, -2, -1, 0, 1, 2, 3].map((value) => (
                <label key={value} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={answers[question.id] === value}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: value }))
                    }
                  />
                  <span className="border-line bg-canvas text-subtle hover:border-primary/50 hover:text-primary-text peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-primary/50 flex min-h-11 items-center justify-center rounded-xl border text-sm font-bold transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
                    {value > 0 ? `+${value}` : value}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {page === 5 && (
        <label className="border-line bg-card flex cursor-pointer items-start gap-3 rounded-2xl border p-5 text-sm leading-relaxed">
          <input
            className="accent-primary mt-1 h-4 w-4 shrink-0"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          {t.consent}
        </label>
      )}
      {message && (
        <p className="text-primary-text text-sm font-semibold" role="status">
          {message}
        </p>
      )}
      <div className="border-line bg-card shadow-soft flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5">
        <span className="text-subtle text-sm font-medium">
          {pageAnswered === 10 ? t.pageComplete : `${pageAnswered} / 10`}
        </span>
        <div className="flex flex-wrap gap-3">
          {page > 0 && (
            <button
              className="border-line text-text hover:border-primary rounded-xl border px-5 py-3 text-sm font-bold transition-colors"
              onClick={() => setPage((value) => value - 1)}
            >
              {t.previous}
            </button>
          )}
          <button
            className="border-line text-text hover:border-primary rounded-xl border px-5 py-3 text-sm font-bold transition-colors disabled:opacity-50"
            disabled={busy}
            onClick={save}
          >
            {t.save}
          </button>
          {page < 5 ? (
            <button
              className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={busy}
              onClick={nextPage}
            >
              {t.next}
            </button>
          ) : (
            <button
              className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              disabled={busy || !eligible}
              onClick={finish}
            >
              {t.finish}
            </button>
          )}
          {result && (
            <button
              className="border-line text-text rounded-xl border px-5 py-3 text-sm font-bold"
              disabled={busy}
              onClick={remove}
            >
              {t.delete}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
