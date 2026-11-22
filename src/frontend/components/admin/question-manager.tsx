"use client";

import type { PersonalityQuestion, PersonalityType } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function QuestionManager({
  questions,
  types,
  retakeDays,
}: {
  questions: PersonalityQuestion[];
  types: PersonalityType[];
  retakeDays: number;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(questions[0]?.id ?? "");
  const [selectedCode, setSelectedCode] = useState(types[0]?.code ?? "");
  const current = questions.find((question) => question.id === selectedId);
  const currentType = types.find((type) => type.code === selectedCode);
  const [error, setError] = useState("");
  async function saveQuestion(form: FormData) {
    if (!current) return;
    setError("");
    const body = Object.fromEntries(form.entries());
    const response = await fetch(
      `/api/admin/personality-questions/${current.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) setError("Savol saqlanmadi.");
    else router.refresh();
  }
  async function createQuestion(form: FormData) {
    setError("");
    const body = {
      ...Object.fromEntries(form.entries()),
      sort: Number(form.get("sort")),
      direction: Number(form.get("direction")),
    };
    const response = await fetch("/api/admin/personality-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) setError("Yangi savol yaratilmadi.");
    else router.refresh();
  }
  async function deactivateQuestion() {
    if (
      !current ||
      !window.confirm(
        "Savolni o'chirasizmi? Test 60 ta faol savol bo'lmaguncha ishlamaydi.",
      )
    )
      return;
    const response = await fetch(
      `/api/admin/personality-questions/${current.id}`,
      { method: "DELETE" },
    );
    if (!response.ok) setError("Savol o'chirilmadi.");
    else router.refresh();
  }
  async function saveType(form: FormData) {
    if (!currentType) return;
    setError("");
    const body = Object.fromEntries(form.entries());
    const response = await fetch(
      `/api/admin/personality-types/${currentType.code}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) setError("Tip tavsifi saqlanmadi.");
    else router.refresh();
  }
  async function saveDays(form: FormData) {
    const response = await fetch("/api/admin/personality-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retakeDays: Number(form.get("retakeDays")) }),
    });
    if (!response.ok) setError("Muddat saqlanmadi.");
    else router.refresh();
  }
  return (
    <div className="space-y-8">
      <form
        action={saveDays}
        className="border-line flex items-end gap-3 rounded-2xl border p-5"
      >
        <label>
          {"Qayta topshirish oralig'i (kun)"}
          <input
            name="retakeDays"
            type="number"
            min={1}
            max={365}
            defaultValue={retakeDays}
            className="border-line mt-1 block rounded-xl border p-2"
          />
        </label>
        <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
          {"Saqlash"}
        </button>
      </form>
      <section className="border-line space-y-4 rounded-2xl border p-5">
        <h2 className="text-xl font-bold">
          {"Test savollari"} (
          {questions.filter((question) => question.isActive).length}/60)
        </h2>
        <select
          className="border-line w-full rounded-xl border p-2"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.sort + 1}. {question.textUz}
            </option>
          ))}
        </select>
        {current && (
          <form key={current.id} action={saveQuestion} className="space-y-3">
            {(["textUz", "textKk", "textRu", "textEn"] as const).map(
              (field) => (
                <label key={field} className="block">
                  {field}
                  <textarea
                    name={field}
                    required
                    minLength={5}
                    maxLength={500}
                    defaultValue={current[field]}
                    className="border-line mt-1 w-full rounded-xl border p-2"
                    rows={2}
                  />
                </label>
              ),
            )}
            <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
              {"Saqlash"}
            </button>
          </form>
        )}
        {current && (
          <button
            type="button"
            className="border-line rounded-xl border px-4 py-2"
            onClick={deactivateQuestion}
          >
            {"O'chirish"}
          </button>
        )}
        <details className="border-line rounded-xl border p-3">
          <summary>{"Yangi savol"}</summary>
          <form
            action={createQuestion}
            className="mt-3 grid gap-3 sm:grid-cols-2"
          >
            <label>
              {"ID"}
              <input
                name="id"
                required
                className="border-line mt-1 w-full rounded-xl border p-2"
              />
            </label>
            <label>
              {"Shkala"}
              <select
                name="scale"
                className="border-line mt-1 w-full rounded-xl border p-2"
              >
                {["MIND", "ENERGY", "NATURE", "TACTICS", "IDENTITY"].map(
                  (scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              {"Yo'nalish"}
              <select
                name="direction"
                className="border-line mt-1 w-full rounded-xl border p-2"
              >
                <option value={1}>+1</option>
                <option value={-1}>-1</option>
              </select>
            </label>
            <label>
              {"Tartib"}
              <input
                type="number"
                name="sort"
                min={0}
                max={999}
                required
                className="border-line mt-1 w-full rounded-xl border p-2"
              />
            </label>
            {(["textUz", "textKk", "textRu", "textEn"] as const).map(
              (field) => (
                <label key={field}>
                  {field}
                  <textarea
                    name={field}
                    required
                    minLength={5}
                    maxLength={500}
                    className="border-line mt-1 w-full rounded-xl border p-2"
                  />
                </label>
              ),
            )}
            <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
              {"Yaratish"}
            </button>
          </form>
        </details>
      </section>
      <section className="border-line space-y-4 rounded-2xl border p-5">
        <h2 className="text-xl font-bold">{"16 tip tavsifi"}</h2>
        <select
          className="border-line w-full rounded-xl border p-2"
          value={selectedCode}
          onChange={(event) => setSelectedCode(event.target.value)}
        >
          {types.map((type) => (
            <option key={type.code} value={type.code}>
              {type.code}
            </option>
          ))}
        </select>
        {currentType && (
          <form key={currentType.code} action={saveType} className="space-y-3">
            {(["Uz", "Kk", "Ru", "En"] as const)
              .flatMap(
                (lang) => [`title${lang}`, `description${lang}`] as const,
              )
              .map((field) => (
                <label key={field} className="block">
                  {field}
                  <textarea
                    name={field}
                    required
                    minLength={2}
                    maxLength={500}
                    defaultValue={currentType[field]}
                    className="border-line mt-1 w-full rounded-xl border p-2"
                    rows={2}
                  />
                </label>
              ))}
            <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
              {"Saqlash"}
            </button>
          </form>
        )}
      </section>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
