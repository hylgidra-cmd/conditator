"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type GroupItem = { code: string; name: string; summary: string };
type TypeItem = { code: string; group: string; name: string; strengths: string };
type ProfessionArea = {
  id: string;
  name: string;
  items: Array<{ id: string; name: string; suggestedTypes: string[] }>;
};
type SavedTemplate = {
  id: string;
  name: string;
  wantedTypes: string[];
  wantedGroups: string[];
};

const copy = {
  uz: {
    heading: "Qanday odam kerak? (ixtiyoriy)",
    sub: "Kasb tanlang — tavsiya etilgan xarakter tiplari avtomatik belgilanadi. Xohlasangiz o'zgartiring (1–4 ta tip yoki butun guruh).",
    professionLabel: "Kasb yo'nalishi (tavsiya uchun)",
    professionPlaceholder: "Kasbni tanlang...",
    groupsLabel: "Xarakter guruhlari",
    typesLabel: "Xarakter tiplari (1–4 ta tanlang)",
    templatesLabel: "Mening shablonlarim",
    templatePlaceholder: "Shablon nomi (masalan: Sotuvchi)",
    saveTemplate: "Shablon saqlash",
    saving: "Saqlanmoqda...",
    clear: "Tozalash",
    selectedCount: "Tanlangan",
  },
  kk: {
    heading: "Qanday adam kerek? (ıqtıyarlı)",
    sub: "Kásip tańlań — usınılǵan xarakter tipleri avtomat belgilenedi. Qáleseńiz ózgertiń (1–4 tip yamasa pútkil topar).",
    professionLabel: "Kásip baǵdarı (usınıs ushın)",
    professionPlaceholder: "Kásipti tańlań...",
    groupsLabel: "Xarakter toparları",
    typesLabel: "Xarakter tipleri (1–4 tańlań)",
    templatesLabel: "Meniń shablonlarım",
    templatePlaceholder: "Shablon atı (mısalı: Satıwshı)",
    saveTemplate: "Shablon saqlaw",
    saving: "Saqlanbaqta...",
    clear: "Tazalaw",
    selectedCount: "Tańlanǵan",
  },
  ru: {
    heading: "Какой человек нужен? (необязательно)",
    sub: "Выберите профессию — рекомендуемые типы характера отметятся автоматически. Можно выбрать 1–4 типа или целую группу.",
    professionLabel: "Профессия (для подсказки)",
    professionPlaceholder: "Выберите профессию...",
    groupsLabel: "Группы характера",
    typesLabel: "Типы характера (от 1 до 4)",
    templatesLabel: "Мои шаблоны",
    templatePlaceholder: "Название шаблона (например: Продавец)",
    saveTemplate: "Сохранить шаблон",
    saving: "Сохранение...",
    clear: "Сбросить",
    selectedCount: "Выбрано",
  },
  en: {
    heading: "What kind of person do you need? (optional)",
    sub: "Pick a profession to auto-select suggested personality types. You can adjust (1–4 types or whole groups).",
    professionLabel: "Profession (for suggestions)",
    professionPlaceholder: "Select profession...",
    groupsLabel: "Personality groups",
    typesLabel: "Personality types (select 1–4)",
    templatesLabel: "My templates",
    templatePlaceholder: "Template name (e.g., Sales rep)",
    saveTemplate: "Save template",
    saving: "Saving...",
    clear: "Clear",
    selectedCount: "Selected",
  },
} as const;

export function VacancyPersonalityPicker({
  professionId,
  wantedTypes,
  wantedGroups,
  onChange,
}: {
  professionId: string | null;
  wantedTypes: string[];
  wantedGroups: string[];
  onChange: (next: {
    professionId: string | null;
    wantedTypes: string[];
    wantedGroups: string[];
  }) => void;
}) {
  const rawLocale = useLocale();
  const lang =
    rawLocale === "kk" || rawLocale === "ru" || rawLocale === "en"
      ? rawLocale
      : "uz";
  const t = copy[lang];

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [professions, setProfessions] = useState<ProfessionArea[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [tplName, setTplName] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    fetch(`/api/professions/suggestions?locale=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setGroups(d.groups ?? []);
        setTypes(d.types ?? []);
        setProfessions(d.professions ?? []);
      })
      .catch(() => {});

    fetch("/api/company/type-templates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.templates) setTemplates(d.templates);
      })
      .catch(() => {});
  }, [lang]);

  function handleProfessionSelect(nextId: string) {
    if (!nextId) {
      onChange({ professionId: null, wantedTypes, wantedGroups });
      return;
    }
    let suggested: string[] = [];
    for (const area of professions) {
      const found = area.items.find((i) => i.id === nextId);
      if (found) {
        suggested = found.suggestedTypes.slice(0, 4);
        break;
      }
    }
    onChange({
      professionId: nextId,
      wantedTypes: suggested.length > 0 ? suggested : wantedTypes,
      wantedGroups: [],
    });
  }

  function toggleGroup(code: string) {
    const exists = wantedGroups.includes(code);
    const nextGroups = exists
      ? wantedGroups.filter((g) => g !== code)
      : [...wantedGroups, code];
    onChange({ professionId, wantedTypes, wantedGroups: nextGroups });
  }

  function toggleType(code: string) {
    const exists = wantedTypes.includes(code);
    if (exists) {
      onChange({
        professionId,
        wantedTypes: wantedTypes.filter((c) => c !== code),
        wantedGroups,
      });
      return;
    }
    if (wantedTypes.length >= 4) return;
    onChange({
      professionId,
      wantedTypes: [...wantedTypes, code],
      wantedGroups,
    });
  }

  async function saveTemplate() {
    const clean = tplName.trim();
    if (!clean || (wantedTypes.length === 0 && wantedGroups.length === 0))
      return;
    setSavingTpl(true);
    try {
      const res = await fetch("/api/company/type-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clean,
          wantedTypes,
          wantedGroups,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { template: SavedTemplate };
        setTemplates((prev) => [data.template, ...prev]);
        setTplName("");
      }
    } finally {
      setSavingTpl(false);
    }
  }

  async function deleteTemplate(id: string) {
    const res = await fetch(`/api/company/type-templates/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTemplates((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <section className="border-line bg-canvas/60 space-y-4 rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-text text-sm font-extrabold sm:text-base">
            {t.heading}
          </h3>
          <p className="text-subtle mt-0.5 text-xs leading-relaxed">{t.sub}</p>
        </div>
        {(wantedTypes.length > 0 || wantedGroups.length > 0) && (
          <button
            type="button"
            onClick={() =>
              onChange({ professionId, wantedTypes: [], wantedGroups: [] })
            }
            className="text-subtle hover:text-text text-xs font-semibold underline"
          >
            {t.clear}
          </button>
        )}
      </div>

      {/* Kasb tanlash -> tavsiya tiplar avtomatik */}
      <div>
        <label className="text-text mb-1.5 block text-xs font-bold">
          {t.professionLabel}
        </label>
        <select
          value={professionId ?? ""}
          onChange={(e) => handleProfessionSelect(e.target.value)}
          className="border-line bg-card text-text w-full rounded-xl border px-3.5 py-2.5 text-sm"
        >
          <option value="">{t.professionPlaceholder}</option>
          {professions.map((area) => (
            <optgroup key={area.id} label={area.name}>
              {area.items.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Mening shablonlarim */}
      {templates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-text text-xs font-bold">{t.templatesLabel}</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="border-line bg-card inline-flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1 text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      professionId,
                      wantedTypes: tpl.wantedTypes,
                      wantedGroups: tpl.wantedGroups,
                    })
                  }
                  className="text-primary-text hover:underline"
                >
                  {tpl.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteTemplate(tpl.id)}
                  className="text-subtle hover:text-danger px-1 text-xs"
                  aria-label="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 ta xarakter guruhi */}
      <div className="space-y-2">
        <p className="text-text text-xs font-bold">{t.groupsLabel}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {groups.map((g) => {
            const active = wantedGroups.includes(g.code);
            return (
              <button
                key={g.code}
                type="button"
                onClick={() => toggleGroup(g.code)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-line bg-card text-text hover:border-primary/50"
                }`}
              >
                <p className="text-xs font-extrabold">{g.name}</p>
                <p className="text-subtle mt-0.5 text-[11px] leading-snug">
                  {g.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 16 ta oddiy nomli tip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-text text-xs font-bold">{t.typesLabel}</p>
          <span className="text-subtle text-xs font-semibold">
            {t.selectedCount}: {wantedTypes.length} / 4
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((item) => {
            const active = wantedTypes.includes(item.code);
            const disabled = !active && wantedTypes.length >= 4;
            return (
              <button
                key={item.code}
                type="button"
                disabled={disabled}
                onClick={() => toggleType(item.code)}
                title={item.strengths}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 ${
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-line bg-card text-text hover:border-primary/60"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shablon qilib saqlash */}
      {(wantedTypes.length > 0 || wantedGroups.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder={t.templatePlaceholder}
            maxLength={80}
            className="border-line bg-card text-text min-w-48 flex-1 rounded-xl border px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={savingTpl || tplName.trim().length < 2}
            onClick={saveTemplate}
            className="border-primary text-primary-text hover:bg-primary-soft rounded-xl border px-4 py-2 text-xs font-bold transition-colors disabled:opacity-40"
          >
            {savingTpl ? t.saving : t.saveTemplate}
          </button>
        </div>
      )}
    </section>
  );
}
