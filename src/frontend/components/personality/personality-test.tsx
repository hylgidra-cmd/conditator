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
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <h1 className="text-3xl font-bold">
          {t.result}: {result.typeCode}-{result.identity}
        </h1>
        <p className="text-muted">{t.intro}</p>
        <div className="space-y-3">
          {(
            [
              result.mindPct,
              result.energyPct,
              result.naturePct,
              result.tacticsPct,
              result.identityPct,
            ] as number[]
          ).map((value, index) => (
            <div key={index}>
              <div className="flex justify-between">
                <span>{t.labels[index]}</span>
                <span>{value}%</span>
              </div>
              <div className="bg-line h-2 rounded-full">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            className="bg-primary text-on-primary rounded-xl px-5 py-3"
            onClick={() => router.push("/student/cv")}
          >
            {t.continue}
          </button>
          <button
            className="border-line rounded-xl border px-5 py-3"
            disabled={busy}
            onClick={remove}
          >
            {t.delete}
          </button>
        </div>
        <p className="text-muted text-sm">
          {t.retakeWait.replace("30", String(retakeDays))}
        </p>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="text-muted">{t.intro}</p>
      <p>
        {t.progress}: {answered}/60
      </p>
      <div className="space-y-5">
        {questions.slice(page * 10, page * 10 + 10).map((question, index) => (
          <fieldset
            key={question.id}
            className="border-line rounded-2xl border p-4"
          >
            <legend className="px-2 font-medium">
              {page * 10 + index + 1}. {question.text}
            </legend>
            <div className="flex justify-between gap-1">
              {[-3, -2, -1, 0, 1, 2, 3].map((value) => (
                <label
                  key={value}
                  className="flex min-w-8 flex-col items-center gap-1 text-sm"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={answers[question.id] === value}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: value }))
                    }
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {page === 5 && (
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          {t.consent}
        </label>
      )}
      {message && <p role="status">{message}</p>}
      <div className="flex flex-wrap gap-3">
        {page > 0 && (
          <button
            className="border-line rounded-xl border px-5 py-3"
            onClick={() => setPage((value) => value - 1)}
          >
            {t.previous}
          </button>
        )}
        <button
          className="border-line rounded-xl border px-5 py-3"
          disabled={busy}
          onClick={save}
        >
          {t.save}
        </button>
        {page < 5 ? (
          <button
            className="bg-primary text-on-primary rounded-xl px-5 py-3"
            disabled={busy}
            onClick={nextPage}
          >
            {t.next}
          </button>
        ) : (
          <button
            className="bg-primary text-on-primary rounded-xl px-5 py-3"
            disabled={busy || !eligible}
            onClick={finish}
          >
            {t.finish}
          </button>
        )}
        {result && (
          <button
            className="border-line rounded-xl border px-5 py-3"
            disabled={busy}
            onClick={remove}
          >
            {t.delete}
          </button>
        )}
      </div>
    </main>
  );
}
