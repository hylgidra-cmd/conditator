import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/backend/format-date";
import { Prisma, VacancyStatus, WorkType } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export default async function PublicVacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    workType?: string;
    location?: string;
    minSalary?: string;
  }>;
}) {
  const { q, workType, location, minSalary } = await searchParams;
  const t = await getTranslations("VacanciesList");
  const user = await currentUser();

  const now = new Date();
  const andConditions: Prisma.VacancyWhereInput[] = [
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  ];

  if (workType && Object.values(WorkType).includes(workType as WorkType)) {
    andConditions.push({ workType: workType as WorkType });
  }

  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { rawText: { contains: q, mode: "insensitive" } },
        { skills: { has: q } },
      ],
    });
  }

  if (location) {
    andConditions.push({
      location: { contains: location, mode: "insensitive" },
    });
  }

  const parsedSalary = minSalary ? Number(minSalary) : NaN;
  if (!Number.isNaN(parsedSalary) && parsedSalary > 0) {
    andConditions.push({
      OR: [
        { salaryTo: { gte: parsedSalary } },
        { salaryFrom: { gte: parsedSalary } },
      ],
    });
  }

  const where: Prisma.VacancyWhereInput = {
    status: VacancyStatus.ACTIVE,
    AND: andConditions,
  };

  const [vacancies, studentCv] = await Promise.all([
    db.vacancy.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoPath: true,
            industry: true,
            approval: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    user?.role === "STUDENT"
      ? db.cv.findFirst({
          where: { userId: user.id, savedAt: { not: null } },
          select: { skills: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const studentSkills = new Set(
    (studentCv?.skills ?? []).map((s) => s.toLowerCase()),
  );
  const recommended =
    studentSkills.size > 0
      ? vacancies
          .filter((v) =>
            v.skills.some((skill) => studentSkills.has(skill.toLowerCase())),
          )
          .slice(0, 3)
      : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-muted max-w-2xl text-base">{t("description")}</p>

        {/* Search & Filter Bar */}
        <form method="GET" className="flex flex-wrap gap-3 pt-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="border-border bg-surface focus:border-brand min-w-[200px] flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          />
          <input
            type="text"
            name="location"
            defaultValue={location ?? ""}
            placeholder={t("locationPlaceholder")}
            className="border-border bg-surface focus:border-brand w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 sm:w-44"
          />
          <input
            type="number"
            name="minSalary"
            min={0}
            step={500000}
            defaultValue={minSalary ?? ""}
            placeholder={t("minSalaryPlaceholder")}
            className="border-border bg-surface focus:border-brand w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 sm:w-44"
          />
          <select
            name="workType"
            defaultValue={workType ?? ""}
            className="border-border bg-surface focus:border-brand rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
          >
            <option value="">{t("allWorkTypes")}</option>
            <option value="FULL_TIME">{t("workTypes.FULL_TIME")}</option>
            <option value="PART_TIME">{t("workTypes.PART_TIME")}</option>
            <option value="REMOTE">{t("workTypes.REMOTE")}</option>
            <option value="INTERNSHIP">{t("workTypes.INTERNSHIP")}</option>
          </select>
          <button
            type="submit"
            className="bg-brand text-brand-foreground rounded-xl px-6 py-2.5 text-sm font-bold shadow transition-colors hover:opacity-95"
          >
            {t("search")}
          </button>
        </form>
      </div>

      {recommended.length > 0 ? (
        <section className="border-brand/30 bg-brand-soft/40 space-y-3 rounded-2xl border p-5">
          <div>
            <h2 className="text-lg font-bold">{t("recommendedTitle")}</h2>
            <p className="text-muted text-xs">{t("recommendedSubtitle")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommended.map((v) => (
              <Link
                key={v.id}
                href={`/vacancies/${v.id}`}
                className="border-border bg-surface hover:border-brand block rounded-xl border p-4 transition"
              >
                <p className="text-muted truncate text-xs font-semibold uppercase">
                  {v.company.name ?? ""}
                </p>
                <p className="mt-1 line-clamp-1 font-bold">{v.title}</p>
                {v.location ? (
                  <p className="text-muted mt-1 truncate text-xs">
                    {v.location}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Vacancies List */}
      {vacancies.length === 0 ? (
        <div className="border-border bg-surface rounded-2xl border p-12 text-center">
          <p className="text-muted text-lg">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {vacancies.map((vacancy) => (
            <Link
              key={vacancy.id}
              href={`/vacancies/${vacancy.id}`}
              className="border-border bg-surface hover:border-brand group block rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted text-xs font-semibold tracking-wider uppercase">
                      {vacancy.company.name ?? ""}
                    </span>
                    {vacancy.company.industry && (
                      <span className="text-muted text-xs">
                        {"· "}
                        {vacancy.company.industry}
                      </span>
                    )}
                  </div>
                  <h2 className="group-hover:text-brand text-xl font-bold transition-colors">
                    {vacancy.title}
                  </h2>
                </div>

                {/* Salary */}
                <div className="text-right">
                  {vacancy.salaryFrom || vacancy.salaryTo ? (
                    <span className="text-brand text-base font-bold">
                      {vacancy.salaryFrom
                        ? `${vacancy.salaryFrom.toLocaleString()} `
                        : ""}
                      {vacancy.salaryTo
                        ? `– ${vacancy.salaryTo.toLocaleString()} `
                        : ""}
                      {vacancy.currency}
                    </span>
                  ) : (
                    <span className="text-muted text-sm font-medium">
                      {t("salaryNegotiable")}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges / Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                {vacancy.workType && (
                  <span className="bg-brand-soft text-brand rounded-lg px-2.5 py-1 font-semibold">
                    {t(
                      `workTypes.${vacancy.workType}` as "workTypes.FULL_TIME",
                    )}
                  </span>
                )}
                {vacancy.location && (
                  <span className="border-border rounded-lg border px-2.5 py-1 text-gray-600">
                    {t("location", { location: vacancy.location })}
                  </span>
                )}
                {vacancy.minExperienceYears !== null && (
                  <span className="border-border rounded-lg border px-2.5 py-1 text-gray-600">
                    {vacancy.minExperienceYears > 0
                      ? t("experience", { years: vacancy.minExperienceYears })
                      : t("noExperience")}
                  </span>
                )}
                <span className="text-muted ml-auto">
                  {formatDate(vacancy.createdAt)}
                </span>
              </div>

              {/* Skills */}
              {vacancy.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
                  {vacancy.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {vacancy.skills.length > 6 && (
                    <span className="text-muted self-center text-xs">
                      {t("moreSkills", { count: vacancy.skills.length - 6 })}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
