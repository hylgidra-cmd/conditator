"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type Lang = "uz" | "kk" | "ru" | "en";

type StatsResponse = {
  updatedAt: string;
  totalStudents: { count: number | null; display: string; masked: boolean };
  professions: Array<{
    professionId: string;
    areaName: string;
    professionName: string;
    count: number | null;
    display: string;
    masked: boolean;
  }>;
  skills: Array<{
    skill: string;
    count: number | null;
    display: string;
    masked: boolean;
  }>;
  groups: Array<{
    groupCode: string;
    groupName: string;
    groupSummary: string;
    count: number | null;
    display: string;
    masked: boolean;
  }>;
  types: Array<{
    groupCode: string;
    groupName: string;
    typeName: string;
    filterCode: string;
    count: number | null;
    display: string;
    masked: boolean;
  }>;
  availableRegions: string[];
  availableLanguages: string[];
};

const copy = {
  uz: {
    title: "Kasb va ko'nikmalar statistikasi",
    subtitle:
      "Butun Candidator bo'yicha anonim talabalar soni — hudud, til, tajriba va xarakter kesimida.",
    updated: "Yangilangan",
    total: "Jami talabalar",
    exportBtn: "Excel yuklab olish (.xlsx)",
    allRegions: "Barcha hududlar",
    allLanguages: "Barcha tillar",
    allExperience: "Barcha tajribalar",
    allGroups: "Barcha xarakter guruhlari",
    expNone: "Tajribasiz",
    expUnder1: "1 yilgacha",
    exp1to3: "1–3 yil",
    expOver3: "3 yildan ko'p",
    professionsTitle: "Kasblar bo'yicha",
    skillsTitle: "Ko'nikmalar (TOP 30)",
    groupsTitle: "4 ta xarakter guruhi",
    typesTitle: "16 ta xarakter tipi",
    lessThanFive: "5 dan kam",
    empty: "Tanlangan filtr bo'yicha ma'lumot topilmadi.",
    loading: "Yuklanmoqda...",
    privacyNote:
      "Faqat umumiy sonlar ko'rsatiladi (ism va kontaktlar yo'q). Raqamni bossangiz, mos talabalar ro'yxati ochiladi.",
    studentsLink: "Talabalar ro'yxati",
  },
  kk: {
    title: "Kásip hám kónlikpeler statistikası",
    subtitle:
      "Pútkil Candidator boyınsha anonim studentler sanı — aymaq, til, tájiriybe hám xarakter kesiminde.",
    updated: "Jańalanǵan",
    total: "Jámi studentler",
    exportBtn: "Excel júklep alıw (.xlsx)",
    allRegions: "Barlıq aymaqlar",
    allLanguages: "Barlıq tiller",
    allExperience: "Barlıq tájiriybeler",
    allGroups: "Barlıq xarakter toparları",
    expNone: "Tájiriybesiz",
    expUnder1: "1 jılǵa shekem",
    exp1to3: "1–3 jıl",
    expOver3: "3 jıldan kóp",
    professionsTitle: "Kásipler boyınsha",
    skillsTitle: "Kónlikpeler (TOP 30)",
    groupsTitle: "4 xarakter toparı",
    typesTitle: "16 xarakter tipi",
    lessThanFive: "5 ten az",
    empty: "Tańlanǵan filtr boyınsha maǵlıwmat tabılmadı.",
    loading: "Júklenbekte...",
    privacyNote:
      "Tek ulıwma sanlar kórsetiledi (at hám baylanıslar joq). Sandı bassańız, sáykes studentler dizimi ashıladı.",
    studentsLink: "Studentler dizimi",
  },
  ru: {
    title: "Статистика профессий и навыков",
    subtitle:
      "Анонимная статистика по всем студентам Candidator с фильтрами по региону, языку, опыту и характеру.",
    updated: "Обновлено",
    total: "Всего студентов",
    exportBtn: "Скачать Excel (.xlsx)",
    allRegions: "Все регионы",
    allLanguages: "Все языки",
    allExperience: "Любой опыт",
    allGroups: "Все группы характера",
    expNone: "Без опыта",
    expUnder1: "До 1 года",
    exp1to3: "1–3 года",
    expOver3: "Более 3 лет",
    professionsTitle: "По профессиям",
    skillsTitle: "Навыки (ТОП 30)",
    groupsTitle: "4 группы характера",
    typesTitle: "16 типов характера",
    lessThanFive: "Менее 5",
    empty: "По выбранным фильтрам данных нет.",
    loading: "Загрузка...",
    privacyNote:
      "Показываются только числа без имён и контактов. Нажмите на число, чтобы перейти к списку студентов.",
    studentsLink: "Список студентов",
  },
  en: {
    title: "Professions & Skills Statistics",
    subtitle:
      "Anonymous talent counts across Candidator by region, language, experience, and personality.",
    updated: "Updated",
    total: "Total students",
    exportBtn: "Download Excel (.xlsx)",
    allRegions: "All regions",
    allLanguages: "All languages",
    allExperience: "All experience",
    allGroups: "All personality groups",
    expNone: "No experience",
    expUnder1: "Under 1 year",
    exp1to3: "1–3 years",
    expOver3: "3+ years",
    professionsTitle: "By profession",
    skillsTitle: "Top 30 skills",
    groupsTitle: "4 personality groups",
    typesTitle: "16 personality types",
    lessThanFive: "Less than 5",
    empty: "No matching data for selected filters.",
    loading: "Loading...",
    privacyNote:
      "Only aggregate counts are shown (no names or contacts). Click any count to open the filtered student list.",
    studentsLink: "Student directory",
  },
} as const;

export function CompanyStatsView({
  locale,
  initialData,
  isAdmin = false,
}: {
  locale: Lang;
  initialData: StatsResponse;
  isAdmin?: boolean;
}) {
  const t = copy[locale];
  const [data, setData] = useState<StatsResponse>(initialData);
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [experienceBand, setExperienceBand] = useState("");
  const [personalityGroup, setPersonalityGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedProfId, setExpandedProfId] = useState<string | null>(null);
  const [profSkillsMap, setProfSkillsMap] = useState<
    Record<
      string,
      Array<{
        id: string;
        position: number;
        name: string;
        matchedCount: number | null;
        belowThreshold: boolean;
        totalCandidates: number | null;
        totalBelowThreshold: boolean;
      }>
    >
  >({});
  const [loadingProfSkillsId, setLoadingProfSkillsId] = useState<string | null>(
    null,
  );

  async function toggleExpandProfession(professionId: string) {
    if (expandedProfId === professionId) {
      setExpandedProfId(null);
      return;
    }
    setExpandedProfId(professionId);
    if (profSkillsMap[professionId]) return;
    setLoadingProfSkillsId(professionId);
    try {
      const res = await fetch(
        `/api/company/statistics/professions/${encodeURIComponent(professionId)}/skills?locale=${locale}`,
      );
      if (res.ok) {
        const json = (await res.json()) as {
          skills?: (typeof profSkillsMap)[string];
        };
        if (json.skills) {
          setProfSkillsMap((prev) => ({
            ...prev,
            [professionId]: json.skills ?? [],
          }));
        }
      }
    } finally {
      setLoadingProfSkillsId(null);
    }
  }

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set("locale", locale);
    if (region) p.set("region", region);
    if (language) p.set("language", language);
    if (experienceBand) p.set("experienceBand", experienceBand);
    if (personalityGroup) p.set("personalityGroup", personalityGroup);
    return p.toString();
  }, [locale, region, language, experienceBand, personalityGroup]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/company/stats?${buildQuery()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: StatsResponse | null) => {
        if (json) setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [buildQuery]);

  const formatCount = (item: { display: string; masked: boolean }) =>
    item.masked ? t.lessThanFive : item.display;

  const formattedDate = new Intl.DateTimeFormat(
    locale === "ru" ? "ru-RU" : "uz-UZ",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  ).format(new Date(data.updatedAt));

  const studentsHref = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (region) p.set("location", region);
    if (language) p.set("language", language);
    if (experienceBand) p.set("experienceBand", experienceBand);
    if (personalityGroup) p.set("personalityGroup", personalityGroup);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    const base = isAdmin ? "/admin/readiness" : "/company/students";
    return `${base}?${p.toString()}`;
  };

  return (
    <main className="page-x mx-auto max-w-6xl space-y-6 py-8">
      <header className="border-line bg-card shadow-soft flex flex-wrap items-start justify-between gap-4 rounded-3xl border p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-text text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t.title}
          </h1>
          <p className="text-subtle text-sm leading-relaxed">{t.subtitle}</p>
          <p className="text-subtle text-xs">
            {t.updated}: <strong className="text-text">{formattedDate}</strong>{" "}
            · {t.total}:{" "}
            <strong className="text-primary-text">
              {formatCount(data.totalStudents)}
            </strong>
          </p>
        </div>
        <a
          href={`/api/company/stats/export?${buildQuery()}`}
          className="bg-primary text-on-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
        >
          {t.exportBtn}
        </a>
      </header>

      {/* Filtrlar */}
      <section className="border-line bg-card shadow-soft grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="border-line bg-canvas text-text rounded-xl border px-3.5 py-2.5 text-sm font-medium"
        >
          <option value="">{t.allRegions}</option>
          {data.availableRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border-line bg-canvas text-text rounded-xl border px-3.5 py-2.5 text-sm font-medium"
        >
          <option value="">{t.allLanguages}</option>
          {data.availableLanguages.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={experienceBand}
          onChange={(e) => setExperienceBand(e.target.value)}
          className="border-line bg-canvas text-text rounded-xl border px-3.5 py-2.5 text-sm font-medium"
        >
          <option value="">{t.allExperience}</option>
          <option value="NONE">{t.expNone}</option>
          <option value="UNDER_1">{t.expUnder1}</option>
          <option value="ONE_TO_THREE">{t.exp1to3}</option>
          <option value="OVER_3">{t.expOver3}</option>
        </select>

        <select
          value={personalityGroup}
          onChange={(e) => setPersonalityGroup(e.target.value)}
          className="border-line bg-canvas text-text rounded-xl border px-3.5 py-2.5 text-sm font-medium"
        >
          <option value="">{t.allGroups}</option>
          {data.groups.map((g) => (
            <option key={g.groupCode} value={g.groupCode}>
              {g.groupName}
            </option>
          ))}
        </select>
      </section>

      <p className="text-subtle text-xs">{t.privacyNote}</p>

      {loading && (
        <p className="text-primary-text text-sm font-semibold">{t.loading}</p>
      )}

      {/* 4 ta xarakter guruhi */}
      <section className="space-y-3">
        <h2 className="text-text text-lg font-extrabold">{t.groupsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.groups.map((g) => (
            <Link
              key={g.groupCode}
              href={studentsHref({ personalityGroup: g.groupCode })}
              className="border-line bg-card hover:border-primary/60 shadow-soft rounded-2xl border p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-text text-base font-bold">{g.groupName}</h3>
                <span className="bg-primary-soft text-primary-text rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                  {formatCount(g)}
                </span>
              </div>
              <p className="text-subtle mt-2 text-xs leading-relaxed">
                {g.groupSummary}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Kasblar va Ko'nikmalar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border-line bg-card shadow-soft rounded-3xl border p-6">
          <h2 className="text-text mb-4 text-lg font-extrabold">
            {t.professionsTitle}
          </h2>
          {data.professions.length === 0 ? (
            <p className="text-subtle text-sm">{t.empty}</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {data.professions.map((row) => {
                const isOpen = expandedProfId === row.professionId;
                const skills = profSkillsMap[row.professionId] ?? [];
                return (
                  <div
                    key={row.professionId}
                    className="border-line bg-canvas/50 rounded-xl border transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleExpandProfession(row.professionId)}
                        className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-left"
                      >
                        <div>
                          <p className="text-text text-sm font-bold">
                            {row.professionName}
                          </p>
                          <p className="text-subtle text-xs">{row.areaName}</p>
                        </div>
                        <span className="text-subtle text-xs font-bold">
                          {isOpen ? "▴" : "▾"}
                        </span>
                      </button>
                      <Link
                        href={studentsHref({ professionId: row.professionId })}
                        className="bg-primary-soft text-primary-text hover:bg-primary hover:text-on-primary shrink-0 rounded-full px-3 py-1 text-xs font-extrabold transition-colors"
                      >
                        {formatCount(row)}
                      </Link>
                    </div>

                    {isOpen ? (
                      <div className="border-line/70 border-t px-3.5 py-2.5">
                        {loadingProfSkillsId === row.professionId ? (
                          <p className="text-subtle text-xs">{t.loading}</p>
                        ) : skills.length === 0 ? (
                          <p className="text-subtle text-xs">{t.empty}</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {skills.map((sk) => (
                              <li
                                key={sk.id}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="text-text font-semibold">
                                  {sk.position}. {sk.name}
                                </span>
                                <span className="text-primary-text shrink-0 font-extrabold">
                                  {sk.belowThreshold
                                    ? t.lessThanFive
                                    : sk.totalBelowThreshold ||
                                        sk.totalCandidates === null
                                      ? String(sk.matchedCount)
                                      : `${sk.matchedCount} / ${sk.totalCandidates}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="border-line bg-card shadow-soft rounded-3xl border p-6">
          <h2 className="text-text mb-4 text-lg font-extrabold">
            {t.skillsTitle}
          </h2>
          {data.skills.length === 0 ? (
            <p className="text-subtle text-sm">{t.empty}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.skills.map((row) => (
                <Link
                  key={row.skill}
                  href={studentsHref({ q: row.skill })}
                  className="border-line bg-canvas hover:border-primary/60 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  <span className="text-text">{row.skill}</span>
                  <span className="text-primary-text font-extrabold">
                    {formatCount(row)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 16 ta xarakter tipi */}
      <section className="border-line bg-card shadow-soft rounded-3xl border p-6">
        <h2 className="text-text mb-4 text-lg font-extrabold">
          {t.typesTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.types.map((row) => (
            <Link
              key={row.filterCode}
              href={studentsHref({ typeCode: row.filterCode })}
              className="border-line bg-canvas/60 hover:border-primary/60 flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 transition-colors"
            >
              <div>
                <p className="text-text text-sm font-bold">{row.typeName}</p>
                <p className="text-subtle text-xs">{row.groupName}</p>
              </div>
              <span className="bg-primary-soft text-primary-text shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                {formatCount(row)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
