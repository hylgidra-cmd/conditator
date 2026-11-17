import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/frontend/components/ds/motion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("jobs") };
}
import {
  ArrowRightIcon,
  BriefcaseIcon,
  MapPinIcon,
  SearchIcon,
  SparkIcon,
} from "@/frontend/components/icons";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { Link, redirect } from "@/i18n/navigation";
import { formatDate } from "@/backend/format-date";
import { Prisma, VacancyStatus, WorkType } from "@prisma/client";
import { getLocale } from "next-intl/server";

const REVEAL_DELAYS = [0, 75, 150, 225] as const;

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
  const user = await currentUser();
  if (user?.role === "COMPANY") {
    const locale = await getLocale();
    return redirect({ href: "/company/students", locale });
  }

  const { q, workType, location, minSalary } = await searchParams;
  const t = await getTranslations("VacanciesList");

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
    company: { approval: "APPROVED" },
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
    <div className="page-x font-ui space-y-8 py-8 sm:py-12">
      {/* Page Header & Glassmorphic Filter Panel */}
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 space-y-2">
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-subtle max-w-2xl text-sm sm:text-base">
              {t("description")}
            </p>
          </div>

          <form
            method="GET"
            className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
          >
            <div className="relative">
              <SearchIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder={t("searchPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-colors"
              />
            </div>

            <div className="relative">
              <MapPinIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="text"
                name="location"
                defaultValue={location ?? ""}
                placeholder={t("locationPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-colors"
              />
            </div>

            <input
              type="number"
              name="minSalary"
              min={0}
              step={500000}
              defaultValue={minSalary ?? ""}
              placeholder={t("minSalaryPlaceholder")}
              className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-colors"
            />

            <select
              name="workType"
              defaultValue={workType ?? ""}
              className="border-line bg-canvas text-text focus:border-primary w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-colors"
            >
              <option value="">{t("allWorkTypes")}</option>
              <option value="FULL_TIME">{t("workTypes.FULL_TIME")}</option>
              <option value="PART_TIME">{t("workTypes.PART_TIME")}</option>
              <option value="REMOTE">{t("workTypes.REMOTE")}</option>
              <option value="INTERNSHIP">{t("workTypes.INTERNSHIP")}</option>
            </select>

            <button
              type="submit"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <SearchIcon size={16} />
              {t("search")}
            </button>
          </form>
        </div>
      </Reveal>

      {/* Recommended for student */}
      {recommended.length > 0 ? (
        <Reveal delay={75}>
          <section className="border-primary/30 bg-primary-soft/25 space-y-4 rounded-3xl border p-6 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary-soft text-primary-text inline-flex size-9 items-center justify-center rounded-xl">
                <SparkIcon size={18} />
              </span>
              <div>
                <h2 className="text-text text-lg font-extrabold">
                  {t("recommendedTitle")}
                </h2>
                <p className="text-subtle text-xs">{t("recommendedSubtitle")}</p>
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {recommended.map((v) => (
                <Link
                  key={v.id}
                  href={`/vacancies/${v.id}`}
                  className="border-line bg-card/90 hover:border-primary/60 shadow-soft hover:shadow-float group block rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1"
                >
                  <p className="text-subtle truncate text-xs font-bold uppercase">
                    {v.company.name ?? ""}
                  </p>
                  <p className="text-text group-hover:text-primary-text mt-1 line-clamp-1 font-bold transition-colors">
                    {v.title}
                  </p>
                  {v.location ? (
                    <p className="text-subtle mt-1.5 flex items-center gap-1 truncate text-xs">
                      <MapPinIcon size={12} />
                      {v.location}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      {/* Vacancies List */}
      {vacancies.length === 0 ? (
        <Reveal>
          <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-md">
            <BriefcaseIcon size={32} className="text-subtle mx-auto mb-3" />
            <p className="text-subtle text-base font-medium">{t("empty")}</p>
          </div>
        </Reveal>
      ) : (
        <div className="grid gap-4">
          {vacancies.map((vacancy, idx) => {
            const salaryLabel =
              vacancy.salaryFrom || vacancy.salaryTo
                ? [
                    vacancy.salaryFrom
                      ? vacancy.salaryFrom.toLocaleString()
                      : "",
                    vacancy.salaryTo
                      ? `– ${vacancy.salaryTo.toLocaleString()}`
                      : "",
                    vacancy.currency,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : null;
            const industryLabel = vacancy.company.industry
              ? `· ${vacancy.company.industry}`
              : null;
            const companyInitial = (
              vacancy.company.name?.trim()?.[0] ?? "C"
            ).toUpperCase();

            return (
              <Reveal key={vacancy.id} delay={REVEAL_DELAYS[idx % 4]}>
                <Link
                  href={`/vacancies/${vacancy.id}`}
                  className="border-line bg-card/90 shadow-soft hover:shadow-float hover:border-primary/45 group block rounded-3xl border p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span
                        aria-hidden
                        className="bg-primary-soft text-primary-text border-primary/20 inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border text-base font-extrabold"
                      >
                        {companyInitial}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-subtle text-xs font-bold tracking-wider uppercase">
                            {vacancy.company.name ?? ""}
                          </span>
                          {industryLabel ? (
                            <span className="text-subtle text-xs">
                              {industryLabel}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-text group-hover:text-primary-text text-lg font-extrabold transition-colors sm:text-xl">
                          {vacancy.title}
                        </h2>
                      </div>
                    </div>

                    {/* Salary */}
                    <div className="flex items-center gap-3">
                      {salaryLabel ? (
                        <span className="bg-primary-soft text-primary-text rounded-xl px-3.5 py-1.5 text-sm font-extrabold tabular-nums">
                          {salaryLabel}
                        </span>
                      ) : (
                        <span className="text-subtle text-xs font-semibold">
                          {t("salaryNegotiable")}
                        </span>
                      )}
                      <span className="border-line bg-card-cool text-subtle group-hover:bg-primary group-hover:text-on-primary hidden size-9 items-center justify-center rounded-full border transition-colors sm:inline-flex">
                        <ArrowRightIcon size={16} />
                      </span>
                    </div>
                  </div>

                  {/* Metadata Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    {vacancy.workType ? (
                      <span className="bg-primary-soft text-primary-text rounded-xl px-3 py-1 font-bold">
                        {t(
                          `workTypes.${vacancy.workType}` as "workTypes.FULL_TIME",
                        )}
                      </span>
                    ) : null}
                    {vacancy.location ? (
                      <span className="border-line bg-card-cool text-text rounded-xl border px-3 py-1 font-medium">
                        {t("location", { location: vacancy.location })}
                      </span>
                    ) : null}
                    {vacancy.minExperienceYears !== null ? (
                      <span className="border-line bg-card-cool text-text rounded-xl border px-3 py-1 font-medium">
                        {vacancy.minExperienceYears > 0
                          ? t("experience", {
                              years: vacancy.minExperienceYears,
                            })
                          : t("noExperience")}
                      </span>
                    ) : null}
                    <span className="text-subtle ml-auto font-medium">
                      {formatDate(vacancy.createdAt)}
                    </span>
                  </div>

                  {/* Skills */}
                  {vacancy.skills.length > 0 ? (
                    <div className="border-line/70 mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                      {vacancy.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="border-line bg-card-cool text-text rounded-lg border px-2.5 py-1 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                      {vacancy.skills.length > 6 ? (
                        <span className="text-subtle self-center px-1 text-xs font-semibold">
                          {t("moreSkills", {
                            count: vacancy.skills.length - 6,
                          })}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
