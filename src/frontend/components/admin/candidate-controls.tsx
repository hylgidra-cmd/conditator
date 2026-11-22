"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function CandidateControls({
  userId,
  resultId,
  professions,
}: {
  userId: string;
  resultId: string | null;
  professions: Array<{ id: string; nameUz: string }>;
}) {
  const router = useRouter();
  const [professionId, setProfessionId] = useState(professions[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change(action: "ADD" | "REMOVE") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/professions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, professionId }),
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError("O'zgarish saqlanmadi.");
    } finally {
      setBusy(false);
    }
  }
  async function invalidate() {
    if (!resultId) return;
    const reason = window.prompt("Natijani bekor qilish sababi:");
    if (!reason || reason.trim().length < 5) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/personality/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setError("Natija bekor qilinmadi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <select
        className="border-line rounded-xl border p-2"
        value={professionId}
        onChange={(event) => setProfessionId(event.target.value)}
      >
        {professions.map((profession) => (
          <option key={profession.id} value={profession.id}>
            {profession.nameUz}
          </option>
        ))}
      </select>
      <button
        className="border-line rounded-xl border px-4 py-2"
        disabled={busy}
        onClick={() => change("ADD")}
      >
        Qo&apos;shish
      </button>
      <button
        className="border-line rounded-xl border px-4 py-2"
        disabled={busy}
        onClick={() => change("REMOVE")}
      >
        Olib tashlash
      </button>
      {resultId && (
        <button
          className="border-line rounded-xl border px-4 py-2"
          disabled={busy}
          onClick={invalidate}
        >
          Testni bekor qilish
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
