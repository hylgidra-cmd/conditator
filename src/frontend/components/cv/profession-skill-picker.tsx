"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type ProfessionArea = {
  id: string;
  name: string;
  professions: Array<{
    id: string;
    name: string;
    hasSkillTemplate: boolean;
  }>;
};

type TemplateSkill = {
  id: string;
  position: number;
  name: string;
  description: string;
  synonyms: string[];
};

const COPY = {
  uz: {
    heading: "Bu kasb uchun eng kerakli 6 ko'nikma",
    selectLabel: "Kasb papkasini tanlang",
    selectPlaceholder: "Kasb tanlang (125 ta shablon)...",
    loading: "Shablon yuklanmoqda...",
    added: "Qo'shilgan",
    hint: "Istalgan ko'nikmani bosing — CV ga qo'shiladi. O'zingiz ham qo'shimcha yozishingiz mumkin.",
  },
  kk: {
    heading: "Бул кәсип ушын ең керекли 6 көнликпе",
    selectLabel: "Кәсип папкасын таңлаң",
    selectPlaceholder: "Кәсип таңлаң (125 шаблон)...",
    loading: "Шаблон жүкленбекте...",
    added: "Қосылған",
    hint: "Қәлеген көнликпени басың — CV ға қосылады.",
  },
  ru: {
    heading: "6 самых нужных навыков для этой профессии",
    selectLabel: "Выберите профессию",
    selectPlaceholder: "Выберите профессию (125 шаблонов)...",
    loading: "Загрузка шаблона...",
    added: "Добавлено",
    hint: "Нажмите на навык, чтобы добавить его в резюме, или введите свой.",
  },
  en: {
    heading: "Top 6 essential skills for this profession",
    selectLabel: "Choose profession",
    selectPlaceholder: "Select a profession (125 templates)...",
    loading: "Loading template...",
    added: "Added",
    hint: "Click any skill chip to add it to your CV, or type your own.",
  },
} as const;

export function ProfessionSkillPicker({
  cvTitle,
  currentSkillsText,
  onAddSkill,
}: {
  cvTitle: string;
  currentSkillsText: string;
  onAddSkill: (skillName: string) => void;
}) {
  const locale = useLocale();
  const lang =
    locale === "kk" || locale === "ru" || locale === "en" ? locale : "uz";
  const t = COPY[lang];

  const [areas, setAreas] = useState<ProfessionArea[]>([]);
  const [selectedProfId, setSelectedProfId] = useState("");
  const [skills, setSkills] = useState<TemplateSkill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/professions?locale=${lang}`)
      .then((r) => r.json())
      .then((data: { areas?: ProfessionArea[] }) => {
        if (!active || !data.areas) return;
        setAreas(data.areas);
        // Auto-suggest matching profession from CV title if nothing chosen yet
        if (!selectedProfId && cvTitle.trim().length >= 3) {
          const lower = cvTitle.toLowerCase();
          for (const a of data.areas) {
            const hit = a.professions.find(
              (p) =>
                p.hasSkillTemplate &&
                (lower.includes(p.name.toLowerCase()) ||
                  p.name.toLowerCase().includes(lower)),
            );
            if (hit) {
              setSelectedProfId(hit.id);
              break;
            }
          }
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (!selectedProfId) {
      setSkills([]);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(
      `/api/professions/${encodeURIComponent(selectedProfId)}/skill-template?locale=${lang}`,
    )
      .then((r) => r.json())
      .then((data: { skills?: TemplateSkill[] }) => {
        if (!active) return;
        setSkills(data.skills ?? []);
      })
      .catch(() => {
        if (active) setSkills([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProfId, lang]);

  const currentTokens = useMemo(
    () =>
      currentSkillsText
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [currentSkillsText],
  );

  function isSkillAlreadyAdded(sk: TemplateSkill): boolean {
    const targets = [sk.name.toLowerCase(), ...sk.synonyms.map((s) => s.toLowerCase())];
    return currentTokens.some((tok) =>
      targets.some(
        (trg) =>
          tok === trg ||
          (tok.length >= 4 && trg.length >= 4 && (tok.includes(trg) || trg.includes(tok))),
      ),
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#cde6da] bg-[#f4fbf7] p-4 dark:border-[#1c5940] dark:bg-[#072117]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-[#0b2017] dark:text-[#eefaf3]">
          {t.heading}
        </p>
        <select
          aria-label={t.selectLabel}
          value={selectedProfId}
          onChange={(e) => setSelectedProfId(e.target.value)}
          className="h-9 max-w-[260px] cursor-pointer rounded-xl border border-[#cde6da] bg-white px-2.5 text-xs font-bold text-[#10291f] outline-none focus:border-[#0e935f] dark:border-[#1f6246] dark:bg-[#082419] dark:text-[#effaf4]"
        >
          <option value="">{t.selectPlaceholder}</option>
          {areas.map((area) => (
            <optgroup key={area.id} label={area.name}>
              {area.professions
                .filter((p) => p.hasSkillTemplate)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-[#5b7a6d] dark:text-[#86b29f]">
          {t.loading}
        </p>
      ) : skills.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map((sk) => {
              const added = isSkillAlreadyAdded(sk);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => onAddSkill(sk.name)}
                  className={`flex cursor-pointer flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    added
                      ? "border-[#0e935f] bg-[#dff6ea] dark:border-[#34eab0] dark:bg-[#0f4530]"
                      : "border-[#d4e9de] bg-white hover:border-[#0e935f] dark:border-[#1c5940] dark:bg-[#082419] dark:hover:border-[#34eab0]"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#0c2219] dark:text-[#f2fbf6]">
                      {sk.position}. {sk.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        added
                          ? "bg-[#0c8a58] text-white dark:bg-[#27eba0] dark:text-[#032216]"
                          : "bg-[#eaf8f1] text-[#09754b] dark:bg-[#0e3928] dark:text-[#3be7a3]"
                      }`}
                    >
                      {added ? `✓ ${t.added}` : "+"}
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] leading-snug text-[#4e6d60] dark:text-[#96bfb0]">
                    {sk.description}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#5c7b6e] dark:text-[#86b09e]">
            {t.hint}
          </p>
        </>
      ) : null}
    </div>
  );
}
