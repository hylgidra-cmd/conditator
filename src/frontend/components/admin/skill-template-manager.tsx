"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestJson } from "@/backend/client/api";

type AreaTreeNode = {
  id: string;
  nameUz: string;
  children: Array<{
    id: string;
    nameUz: string;
    skillCount: number;
  }>;
};

type AdminSkillRow = {
  id?: string;
  position: number;
  nameUz: string;
  nameKk: string;
  nameRu: string;
  nameEn: string;
  descriptionUz: string;
  descriptionKk: string;
  descriptionRu: string;
  descriptionEn: string;
  synonymsText: string;
};

type HistoryRow = {
  id: string;
  action: string;
  adminEmail: string;
  createdAt: string;
  details: unknown;
};

export function SkillTemplateManager({ areas }: { areas: AreaTreeNode[] }) {
  const firstProfId =
    areas.flatMap((a) => a.children).find((c) => c.skillCount === 6)?.id ??
    areas[0]?.children[0]?.id ??
    "";

  const [search, setSearch] = useState("");
  const [selectedProfId, setSelectedProfId] = useState(firstProfId);
  const [professionName, setProfessionName] = useState("");
  const [skills, setSkills] = useState<AdminSkillRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredAreas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas
      .map((a) => ({
        ...a,
        children: a.children.filter(
          (c) =>
            c.nameUz.toLowerCase().includes(q) ||
            a.nameUz.toLowerCase().includes(q),
        ),
      }))
      .filter((a) => a.children.length > 0);
  }, [areas, search]);

  async function loadProfession(profId: string) {
    if (!profId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/professions/${encodeURIComponent(profId)}/skill-template`,
      );
      if (!res.ok) {
        setMessage({
          tone: "err",
          text: "Kasb ko'nikmalarini yuklab bo'lmadi. Qayta urinib ko'ring.",
        });
        return;
      }
      const data = (await res.json()) as {
        professionName: string;
        skills: Array<{
          id: string;
          position: number;
          nameUz: string;
          nameKk: string;
          nameRu: string;
          nameEn: string;
          descriptionUz: string;
          descriptionKk: string;
          descriptionRu: string;
          descriptionEn: string;
          synonyms: string[];
        }>;
        history: HistoryRow[];
      };
      setProfessionName(data.professionName);
      setHistory(data.history ?? []);

      const loaded: AdminSkillRow[] = (data.skills ?? []).map((s) => ({
        id: s.id,
        position: s.position,
        nameUz: s.nameUz,
        nameKk: s.nameKk,
        nameRu: s.nameRu,
        nameEn: s.nameEn,
        descriptionUz: s.descriptionUz,
        descriptionKk: s.descriptionKk,
        descriptionRu: s.descriptionRu,
        descriptionEn: s.descriptionEn,
        synonymsText: s.synonyms.join(", "),
      }));

      // Ensure 6 editable slots for admin
      while (loaded.length < 6) {
        loaded.push({
          position: loaded.length + 1,
          nameUz: "",
          nameKk: "",
          nameRu: "",
          nameEn: "",
          descriptionUz: "",
          descriptionKk: "",
          descriptionRu: "",
          descriptionEn: "",
          synonymsText: "",
        });
      }
      setSkills(loaded.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfession(selectedProfId);
  }, [selectedProfId]);

  function updateRow(index: number, patch: Partial<AdminSkillRow>) {
    setSkills((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)),
    );
  }

  function moveRow(from: number, to: number) {
    if (from === to || to < 0 || to >= skills.length) return;
    setSkills((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next.map((item, idx) => ({ ...item, position: idx + 1 }));
    });
  }

  async function handleSave() {
    if (!selectedProfId || saving) return;
    if (skills.length !== 6) {
      setMessage({
        tone: "err",
        text: "Har bir kasbda aynan 6 ta faol ko'nikma bo'lishi shart.",
      });
      return;
    }
    const incomplete = skills.some(
      (s) => !s.nameUz.trim() || !s.descriptionUz.trim(),
    );
    if (incomplete) {
      setMessage({
        tone: "err",
        text: "Barcha 6 ta ko'nikmaning nomi va izohi to'ldirilishi kerak.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    const payload = {
      skills: skills.map((s, idx) => ({
        id: s.id,
        position: idx + 1,
        nameUz: s.nameUz.trim(),
        nameKk: s.nameKk.trim() || s.nameUz.trim(),
        nameRu: s.nameRu.trim() || s.nameUz.trim(),
        nameEn: s.nameEn.trim() || s.nameUz.trim(),
        descriptionUz: s.descriptionUz.trim(),
        descriptionKk: s.descriptionKk.trim() || s.descriptionUz.trim(),
        descriptionRu: s.descriptionRu.trim() || s.descriptionUz.trim(),
        descriptionEn: s.descriptionEn.trim() || s.descriptionUz.trim(),
        synonyms: s.synonymsText
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      })),
    };

    const res = await requestJson(
      "PUT",
      `/api/admin/professions/${encodeURIComponent(selectedProfId)}/skill-template`,
      payload,
    );
    setSaving(false);

    if (res.ok) {
      setMessage({
        tone: "ok",
        text: "6 ta ko'nikma shabloni saqlandi va tarixga yozildi.",
      });
      void loadProfession(selectedProfId);
    } else {
      setMessage({
        tone: "err",
        text: "Saqlashda xatolik yuz berdi. Barcha 6 maydonni tekshiring.",
      });
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/skill-templates/import", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        updatedProfessions?: number;
        skippedInvalidCount?: number;
      };
      if (res.ok && json.ok) {
        if ((json.updatedProfessions ?? 0) === 0) {
          setMessage({
            tone: "err",
            text: "Faylda mos kasb topilmadi yoki barcha kasblar 6 tadan bo'lmagani uchun o'tkazib yuborildi.",
          });
        } else {
          setMessage({
            tone: "ok",
            text: `Import yakunlandi: ${json.updatedProfessions ?? 0} ta kasb yangilandi${
              json.skippedInvalidCount
                ? `, ${json.skippedInvalidCount} ta kasb (6 ta bo'lmagani uchun) o'tkazib yuborildi`
                : ""
            }.`,
          });
          void loadProfession(selectedProfId);
        }
      } else {
        setMessage({
          tone: "err",
          text: "Excel/CSV faylini yuklashda xatolik yuz berdi.",
        });
      }
    } catch {
      setMessage({
        tone: "err",
        text: "Faylni o'qishda yoki serverga yuborishda xatolik yuz berdi.",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Bulk Excel Actions Bar */}
      <div className="border-line bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div>
          <h2 className="text-text text-base font-extrabold">
            {"Kasb ko'nikma shablonlari (125 kasb × 6 ko'nikma)"}
          </h2>
          <p className="text-subtle text-xs">
            {"Har bir kasbda aynan 6 ta faol ko'nikma bo'ladi. Sudrab tartibini o'zgartirish mumkin."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/admin/skill-templates/export";
            }}
            className="border-line bg-canvas text-text hover:border-primary cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-bold transition"
          >
            {"Excel'ga yuklash (.xlsx)"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-on-primary hover:bg-primary-hover cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-60"
          >
            {importing ? "Yuklanmoqda..." : "Excel'dan yuklash (.xlsx/.csv)"}
          </button>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
            message.tone === "ok"
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {/* Main Split: Left Tree (21 areas -> 126 professions) + Right 6-Skill Editor */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[310px_minmax(0,1fr)] lg:items-start">
        {/* Left Tree */}
        <aside className="border-line bg-card rounded-2xl border p-4 shadow-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Soha yoki kasb qidirish..."
            className="border-line bg-canvas text-text mb-3 h-9 w-full rounded-xl border px-3 text-xs font-medium outline-none"
          />

          <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {filteredAreas.map((area) => (
              <div key={area.id}>
                <p className="text-subtle mb-1 text-[11px] font-extrabold uppercase">
                  {area.nameUz}
                </p>
                <div className="space-y-1">
                  {area.children.map((prof) => {
                    const active = prof.id === selectedProfId;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        onClick={() => setSelectedProfId(prof.id)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-semibold transition ${
                          active
                            ? "bg-primary text-on-primary"
                            : "text-text hover:bg-canvas"
                        }`}
                      >
                        <span className="truncate">{prof.nameUz}</span>
                        <span className="shrink-0 text-[10px] opacity-80">
                          {`${prof.skillCount}/6`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Editor */}
        <div className="space-y-5">
          <section className="border-line bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/15 pb-3">
              <div>
                <h3 className="text-text text-lg font-extrabold">
                  {professionName || "Kasb tanlang"}
                </h3>
                <p className="text-subtle text-xs">
                  {"O'zbek, qoraqalpoq, rus tillarida nomi, izohi va sinonimlari. Karta ustidan sudrab tartibni almashtiring."}
                </p>
              </div>
              <button
                type="button"
                disabled={saving || loading}
                onClick={handleSave}
                className="bg-primary text-on-primary hover:bg-primary-hover cursor-pointer rounded-xl px-5 py-2.5 text-xs font-extrabold transition disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash (6 ta ko'nikma)"}
              </button>
            </div>

            {loading ? (
              <p className="text-subtle py-6 text-sm">{"Yuklanmoqda..."}</p>
            ) : (
              <div className="space-y-3">
                {skills.map((row, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null) moveRow(dragIndex, idx);
                      setDragIndex(null);
                    }}
                    className="border-line bg-canvas/60 space-y-3 rounded-2xl border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-primary-soft text-primary-text rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                        {`#${idx + 1}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveRow(idx, idx - 1)}
                          className="border-line bg-card cursor-pointer rounded-lg border px-2 py-0.5 text-xs font-bold disabled:opacity-35"
                        >
                          {"↑"}
                        </button>
                        <button
                          type="button"
                          disabled={idx === skills.length - 1}
                          onClick={() => moveRow(idx, idx + 1)}
                          className="border-line bg-card cursor-pointer rounded-lg border px-2 py-0.5 text-xs font-bold disabled:opacity-35"
                        >
                          {"↓"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Nomi (O'zbek) *"}
                        </label>
                        <input
                          type="text"
                          value={row.nameUz}
                          onChange={(e) =>
                            updateRow(idx, { nameUz: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Nomi (Qoraqalpoq)"}
                        </label>
                        <input
                          type="text"
                          value={row.nameKk}
                          onChange={(e) =>
                            updateRow(idx, { nameKk: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Nomi (Rus)"}
                        </label>
                        <input
                          type="text"
                          value={row.nameRu}
                          onChange={(e) =>
                            updateRow(idx, { nameRu: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Izoh (O'zbek) *"}
                        </label>
                        <input
                          type="text"
                          value={row.descriptionUz}
                          onChange={(e) =>
                            updateRow(idx, { descriptionUz: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Izoh (Qoraqalpoq)"}
                        </label>
                        <input
                          type="text"
                          value={row.descriptionKk}
                          onChange={(e) =>
                            updateRow(idx, { descriptionKk: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-subtle mb-1 block text-[11px] font-bold">
                          {"Izoh (Rus)"}
                        </label>
                        <input
                          type="text"
                          value={row.descriptionRu}
                          onChange={(e) =>
                            updateRow(idx, { descriptionRu: e.target.value })
                          }
                          className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-subtle mb-1 block text-[11px] font-bold">
                        {"Sinonimlar (vergul bilan, masalan: leadership, liderlik, jamoa boshqaruvi)"}
                      </label>
                      <input
                        type="text"
                        value={row.synonymsText}
                        onChange={(e) =>
                          updateRow(idx, { synonymsText: e.target.value })
                        }
                        className="border-line bg-card text-text h-9 w-full rounded-lg border px-2.5 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Change History (Audit Log) */}
          <section className="border-line bg-card rounded-2xl border p-5 shadow-sm">
            <h3 className="text-text mb-3 text-sm font-extrabold">
              {"O'zgarish tarixi"}
            </h3>
            {history.length === 0 ? (
              <p className="text-subtle text-xs">
                {"Hali o'zgarishlar qayd etilmagan."}
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="border-line bg-canvas/50 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <span className="text-text font-bold">
                      {h.adminEmail} — {h.action}
                    </span>
                    <span className="text-subtle">
                      {new Date(h.createdAt).toLocaleString("uz-UZ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
