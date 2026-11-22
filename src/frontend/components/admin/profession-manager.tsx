"use client";

import type { Profession } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function ProfessionManager({
  professions,
}: {
  professions: Profession[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(professions[0]?.id ?? "new");
  const [message, setMessage] = useState("");
  const selected = professions.find(
    (profession) => profession.id === selectedId,
  );
  const parents = professions.filter((profession) => !profession.parentId);
  async function save(form: FormData) {
    setMessage("");
    const body = {
      parentId: form.get("parentId") || null,
      nameUz: form.get("nameUz"),
      nameKk: form.get("nameKk"),
      nameRu: form.get("nameRu"),
      nameEn: form.get("nameEn"),
      keywords: String(form.get("keywords") ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      educationFields: String(form.get("educationFields") ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
      sort: Number(form.get("sort") || 0),
    };
    const response = await fetch(
      selected
        ? `/api/admin/professions/${selected.id}`
        : "/api/admin/professions",
      {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setMessage(response.ok ? "Saqlandi." : "Saqlanmadi.");
    if (response.ok) router.refresh();
  }
  async function remove() {
    if (!selected || !window.confirm("Bo'sh papkani o'chirasizmi?")) return;
    const response = await fetch(`/api/admin/professions/${selected.id}`, {
      method: "DELETE",
    });
    setMessage(
      response.ok ? "O'chirildi." : "Papka bo'sh emas yoki o'chirib bo'lmadi.",
    );
    if (response.ok) {
      setSelectedId("new");
      router.refresh();
    }
  }
  return (
    <div className="border-line space-y-4 rounded-2xl border p-5">
      <select
        className="border-line w-full rounded-xl border p-2"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        <option value="new">{"Yangi papka"}</option>
        {professions.map((profession) => (
          <option key={profession.id} value={profession.id}>
            {profession.nameUz}
          </option>
        ))}
      </select>
      <form
        key={selectedId}
        action={save}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label>
          {"Ota papka"}
          <select
            name="parentId"
            defaultValue={selected?.parentId ?? ""}
            className="border-line mt-1 w-full rounded-xl border p-2"
          >
            <option value="">{"Soha"}</option>
            {parents
              .filter((parent) => parent.id !== selectedId)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.nameUz}
                </option>
              ))}
          </select>
        </label>
        {(["nameUz", "nameKk", "nameRu", "nameEn"] as const).map((field) => (
          <label key={field}>
            {field}
            <input
              name={field}
              required
              minLength={2}
              maxLength={150}
              defaultValue={selected?.[field] ?? ""}
              className="border-line mt-1 w-full rounded-xl border p-2"
            />
          </label>
        ))}
        <label>
          {"Kalit so'zlar"}
          <input
            name="keywords"
            defaultValue={selected?.keywords.join(", ") ?? ""}
            className="border-line mt-1 w-full rounded-xl border p-2"
          />
        </label>
        <label>
          {"Ta'lim yo'nalishlari"}
          <input
            name="educationFields"
            defaultValue={selected?.educationFields.join(", ") ?? ""}
            className="border-line mt-1 w-full rounded-xl border p-2"
          />
        </label>
        <label>
          {"Tartib"}
          <input
            name="sort"
            type="number"
            min={0}
            defaultValue={selected?.sort ?? 0}
            className="border-line mt-1 w-full rounded-xl border p-2"
          />
        </label>
        <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
          {"Saqlash"}
        </button>
      </form>
      {selected && (
        <button
          className="border-line rounded-xl border px-4 py-2"
          onClick={remove}
        >
          {"O'chirish"}
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
