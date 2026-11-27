import { getLocale } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import {
  listReadinessCandidates,
  parseFilters,
} from "@/backend/readiness/query";
import { Link } from "@/i18n/navigation";

const copy = {
  uz: {
    title: "Kasbga yaroqlilik",
    folders: "Kasb papkalari",
    candidates: "Nomzodlar",
    questions: "Savollar va tiplar",
    all: "Hammasi",
    profession: "Kasb",
    group: "Guruh",
    type: "Tip",
    language: "Til",
    experience: "Tajriba",
    search: "Filtrlash",
    export: "Excelga yuklash",
    region: "Hudud",
    score: "Tayyorlik bali",
    count: "Talaba",
    noResults: "Nomzod topilmadi",
    details: "Kartani ochish",
    next: "Keyingi",
    previous: "Oldingi",
  },
  kk: {
    title: "Kásipke tayarlıq",
    folders: "Kásip papkaları",
    candidates: "Talapkerler",
    questions: "Sorawlar hám tipler",
    all: "Hámmesi",
    profession: "Kásip",
    group: "Topar",
    type: "Tip",
    language: "Til",
    experience: "Tájiriybe",
    search: "Súziw",
    export: "Excelge júklew",
    region: "Aymaq",
    score: "Tayarlıq balı",
    count: "Student",
    noResults: "Talapker tabılmadı",
    details: "Kartani ashıw",
    next: "Keyingi",
    previous: "Aldınǵı",
  },
  ru: {
    title: "Профиль кандидатов",
    folders: "Папки профессий",
    candidates: "Кандидаты",
    questions: "Вопросы и типы",
    all: "Все",
    profession: "Профессия",
    group: "Группа",
    type: "Тип",
    language: "Язык",
    experience: "Опыт",
    search: "Фильтровать",
    export: "Скачать Excel",
    region: "Регион",
    score: "Балл готовности",
    count: "Студентов",
    noResults: "Кандидаты не найдены",
    details: "Открыть карточку",
    next: "Далее",
    previous: "Назад",
  },
  en: {
    title: "Candidate readiness",
    folders: "Profession folders",
    candidates: "Candidates",
    questions: "Questions and types",
    all: "All",
    profession: "Profession",
    group: "Group",
    type: "Type",
    language: "Language",
    experience: "Experience",
    search: "Filter",
    export: "Download Excel",
    region: "Region",
    score: "Readiness score",
    count: "Students",
    noResults: "No candidates found",
    details: "Open profile",
    next: "Next",
    previous: "Previous",
  },
} as const;
const counted = (label: string, count: number) => `${label} (${count})`;
const allLabel = (all: string, label: string) => `${all}: ${label}`;
const languageBands = [
  ["NATIVE_ONLY", "0"],
  ["ONE", "1"],
  ["TWO_PLUS", "2+"],
] as const;
const experienceBands = [
  ["NONE", "0"],
  ["UNDER_1", "<1"],
  ["ONE_TO_THREE", "1–3"],
  ["OVER_3", "3+"],
] as const;

export default async function ReadinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();
  const locale = await getLocale();
  const t = copy[locale as keyof typeof copy] ?? copy.uz;
  const params = await searchParams;
  const filters = parseFilters(
    new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] =>
        Boolean(entry[1]),
      ),
    ),
  );
  const [areas, counts, listing] = await Promise.all([
    db.profession.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sort: "asc" } },
      },
      orderBy: { sort: "asc" },
    }),
    db.readinessProfile.groupBy({
      by: ["professionId", "personalityGroup", "typeCode"],
      _count: { _all: true },
    }),
    listReadinessCandidates(filters),
  ]);
  const jobName = (job: {
    nameUz: string;
    nameKk: string;
    nameRu: string;
    nameEn: string;
  }) =>
    locale === "kk"
      ? job.nameKk
      : locale === "ru"
        ? job.nameRu
        : locale === "en"
          ? job.nameEn
          : job.nameUz;
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  const pageHref = (page: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    return `/admin/readiness?${next.toString()}`;
  };
  return (
    <main className="page-x max-w-7xl space-y-8 py-8">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <AdminNav active="readiness" />
      <div className="flex gap-4">
        <Link
          href="/admin/readiness/questions"
          className="text-primary underline"
        >
          {t.questions}
        </Link>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">{t.folders}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {areas.map((area) => (
            <details
              key={area.id}
              className="border-line bg-card rounded-2xl border p-4"
            >
              <summary className="cursor-pointer font-semibold">
                {counted(
                  jobName(area),
                  area.children.reduce(
                    (total, child) =>
                      total +
                      counts
                        .filter((row) => row.professionId === child.id)
                        .reduce((sum, row) => sum + row._count._all, 0),
                    0,
                  ),
                )}
              </summary>
              <div className="mt-3 space-y-2">
                {area.children.map((job) => {
                  const rows = counts.filter(
                    (row) => row.professionId === job.id,
                  );
                  const count = rows.reduce(
                    (sum, row) => sum + row._count._all,
                    0,
                  );
                  return (
                    <details
                      key={job.id}
                      className="border-line rounded-xl border p-3"
                    >
                      <summary className="cursor-pointer">
                        <Link href={`/admin/readiness?professionId=${job.id}`}>
                          {counted(jobName(job), count)}
                        </Link>
                      </summary>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["NT", "NF", "SJ", "SP"] as const).map((group) => {
                          const groupRows = rows.filter(
                            (row) => row.personalityGroup === group,
                          );
                          return (
                            <Link
                              key={group}
                              href={`/admin/readiness?professionId=${job.id}&personalityGroup=${group}`}
                              className="bg-canvas rounded-full px-3 py-1 text-sm"
                            >
                              {counted(
                                group,
                                groupRows.reduce(
                                  (sum, row) => sum + row._count._all,
                                  0,
                                ),
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          {counted(t.candidates, listing.total)}
        </h2>
        <form className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <select
            name="professionId"
            defaultValue={filters.professionId ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label={t.profession}
          >
            <option value="">{allLabel(t.all, t.profession)}</option>
            {areas
              .flatMap((area) => area.children)
              .map((job) => (
                <option key={job.id} value={job.id}>
                  {jobName(job)}
                </option>
              ))}
          </select>
          <select
            name="personalityGroup"
            defaultValue={filters.personalityGroup ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label={t.group}
          >
            <option value="">{allLabel(t.all, t.group)}</option>
            {["NT", "NF", "SJ", "SP"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <input
            name="typeCode"
            defaultValue={filters.typeCode ?? ""}
            placeholder={t.type}
            className="border-line rounded-xl border p-2"
          />
          <input
            name="language"
            defaultValue={filters.language ?? ""}
            placeholder={t.language}
            className="border-line rounded-xl border p-2"
          />
          <input
            name="region"
            defaultValue={filters.region ?? ""}
            placeholder={t.region}
            className="border-line rounded-xl border p-2"
          />
          <select
            name="languageBand"
            defaultValue={filters.languageBand ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label={t.language}
          >
            <option value="">{allLabel(t.all, t.language)}</option>
            {languageBands.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="experienceBand"
            defaultValue={filters.experienceBand ?? ""}
            className="border-line rounded-xl border p-2"
            aria-label={t.experience}
          >
            <option value="">{allLabel(t.all, t.experience)}</option>
            {experienceBands.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="bg-primary text-on-primary rounded-xl px-4 py-2">
            {t.search}
          </button>
          <a
            href={`/api/admin/readiness/export?${query.toString()}`}
            className="border-line rounded-xl border px-4 py-2 text-center"
          >
            {t.export}
          </a>
        </form>
        <div className="border-line overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card">
              <tr>
                <th className="p-3">{t.candidates}</th>
                <th className="p-3">{t.profession}</th>
                <th className="p-3">{t.group}</th>
                <th className="p-3">{t.type}</th>
                <th className="p-3">{t.language}</th>
                <th className="p-3">{t.experience}</th>
                <th className="p-3">{t.score}</th>
                <th className="p-3">{t.details}</th>
              </tr>
            </thead>
            <tbody>
              {listing.rows.map((row) => (
                <tr
                  key={`${row.userId}:${row.professionId}`}
                  className="border-line border-t"
                >
                  <td className="p-3">{row.user.email}</td>
                  <td className="p-3">{jobName(row.profession)}</td>
                  <td className="p-3">{row.personalityGroup}</td>
                  <td className="p-3">{row.typeCode}</td>
                  <td className="p-3">
                    {row.user.userLanguages
                      .map((item) => `${item.language} (${item.level})`)
                      .join(", ")}
                  </td>
                  <td className="p-3">{row.experienceBand}</td>
                  <td className="p-3">{row.readinessScore}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/readiness/${row.userId}`}
                      className="text-primary underline"
                    >
                      {t.details}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listing.rows.length === 0 && <p className="p-4">{t.noResults}</p>}
        </div>
        <div className="flex gap-4">
          {filters.page > 1 && (
            <Link href={pageHref(filters.page - 1)}>{t.previous}</Link>
          )}
          {filters.page * filters.limit < listing.total && (
            <Link href={pageHref(filters.page + 1)}>{t.next}</Link>
          )}
        </div>
      </section>
    </main>
  );
}
