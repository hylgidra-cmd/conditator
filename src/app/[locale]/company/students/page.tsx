import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CompanyStudents");
  return { title: t("title") };
}
import { requireCompanyPage } from "@/backend/company/page";
import { parsePrivacy, sanitizeCvData } from "@/backend/cv/privacy";
import { cvDataSchema } from "@/backend/cv/schema";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { Reveal } from "@/frontend/components/ds/motion";
import { PlusIcon, SearchIcon, UsersIcon } from "@/frontend/components/icons";
import { Link } from "@/i18n/navigation";

const REVEAL_DELAYS = [0, 75, 150, 225] as const;

export default async function CompanyStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { company } = await requireCompanyPage();
  const t = await getTranslations("Company");
  const tStudents = await getTranslations("CompanyStudents");
  const tWork = await getTranslations("StudentCv.workTypes");
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  if (company.approval !== "APPROVED") {
    return (
      <div className="page-x font-ui max-w-3xl space-y-6 py-8 sm:py-12">
        <div className="border-line bg-card/85 shadow-float flex flex-wrap items-center justify-between gap-3 rounded-3xl border p-6 backdrop-blur-xl">
          <h1 className="text-h2 text-text font-extrabold tracking-tight">
            {tStudents("title")}
          </h1>
          <Link
            href="/company"
            className="border-line bg-canvas text-text hover:border-primary rounded-2xl border px-4 py-2 text-xs font-bold transition-colors"
          >
            {t("title")}
          </Link>
        </div>
        <div className="border-primary/30 bg-primary-soft/80 text-text rounded-3xl border p-6 text-sm font-medium backdrop-blur-md">
          {t(`status.${company.approval}`)}
        </div>
      </div>
    );
  }

  const now = new Date();
  const [cvs, lockedMatches, unlocks] = await Promise.all([
    db.cv.findMany({
      where: {
        isVisible: true,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
      },
      orderBy: { savedAt: "desc" },
      take: 60,
      select: {
        id: true,
        title: true,
        location: true,
        workTypes: true,
        skills: true,
        languages: true,
        savedAt: true,
        data: true,
        privacy: true,
      },
    }),
    db.match.findMany({
      where: {
        score: { gte: 80 },
        vacancy: { companyId: company.id },
      },
      select: { cvId: true, vacancyId: true },
    }),
    db.vacancyUnlock.findMany({
      where: { companyId: company.id, expiresAt: { gt: now } },
      select: { vacancyId: true },
    }),
  ]);

  const unlockedVacancyIds = new Set(unlocks.map((u) => u.vacancyId));
  const lockedCvIds = new Set(
    lockedMatches
      .filter((m) => !unlockedVacancyIds.has(m.vacancyId))
      .map((m) => m.cvId),
  );

  const items = cvs
    .map((cv) => {
      const parsed = cvDataSchema.safeParse(cv.data);
      const isLocked = lockedCvIds.has(cv.id);
      const safe = parsed.success
        ? sanitizeCvData(parsed.data, {
            privacy: parsePrivacy(cv.privacy),
            isLocked,
          })
        : null;
      return {
        id: cv.id,
        title: cv.title,
        fullName: safe?.fullName || cv.title || tStudents("title"),
        about: safe?.goal || "",
        location:
          safe?.location ??
          (parsePrivacy(cv.privacy).hideAddress ? "Yashirin hudud" : cv.location),
        workType: cv.workTypes[0] ?? null,
        skills: cv.skills,
        languages: cv.languages,
        savedAt: cv.savedAt,
        isLocked,
      };
    })
    .filter((item) => {
      if (!query) return true;
      const haystack = [
        item.fullName,
        item.title,
        item.location,
        item.about,
        ...item.skills,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

  return (
    <div className="page-x font-ui space-y-8 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-h2 text-text font-extrabold tracking-tight">
                {tStudents("title")}
              </h1>
              <p className="text-subtle mt-1 text-sm">
                {tStudents("subtitle", { count: items.length })}
              </p>
            </div>
            <Link
              href="/company/vacancies/new"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
            >
              <PlusIcon size={15} />
              {tStudents("newVacancy")}
            </Link>
          </div>

          <form method="get" className="relative z-10 mt-6 flex gap-2.5">
            <div className="relative flex-1">
              <SearchIcon
                size={16}
                className="text-subtle pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder={tStudents("searchPlaceholder")}
                className="border-line bg-canvas text-text placeholder:text-subtle focus:border-primary w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
            >
              <SearchIcon size={15} />
              {tStudents("searchButton")}
            </button>
          </form>
        </div>
      </Reveal>

      {items.length === 0 ? (
        <Reveal>
          <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-12 text-center backdrop-blur-md">
            <UsersIcon size={30} className="text-subtle mx-auto mb-3" />
            <p className="text-subtle text-sm font-medium">
              {tStudents("empty")}
            </p>
          </div>
        </Reveal>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item, idx) => {
            const extraSkillsLabel =
              item.skills.length > 6 ? `+${item.skills.length - 6}` : null;
            return (
              <li key={item.id}>
                <Reveal delay={REVEAL_DELAYS[idx % 4]} className="h-full">
                  <div className="border-line bg-card/90 shadow-soft hover:shadow-float hover:border-primary/45 flex h-full flex-col justify-between gap-4 rounded-3xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-text text-base font-extrabold">
                            {item.fullName}
                          </h2>
                          {item.title ? (
                            <p className="text-primary-text mt-0.5 text-xs font-bold">
                              {item.title}
                            </p>
                          ) : null}
                        </div>
                        {item.savedAt ? (
                          <span className="text-subtle shrink-0 text-xs font-medium">
                            {formatDate(item.savedAt)}
                          </span>
                        ) : null}
                      </div>

                      {item.about ? (
                        <p className="text-subtle line-clamp-2 text-xs leading-relaxed">
                          {item.about}
                        </p>
                      ) : null}

                      <div className="text-subtle flex flex-wrap gap-2 text-xs font-medium">
                        {item.location ? <span>{item.location}</span> : null}
                        {item.workType ? (
                          <span>{tWork(item.workType)}</span>
                        ) : null}
                        {item.languages.length > 0 ? (
                          <span>{item.languages.join(", ")}</span>
                        ) : null}
                      </div>

                      {item.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.skills.slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="border-line bg-card-cool text-text rounded-lg border px-2 py-0.5 text-[11px] font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                          {extraSkillsLabel ? (
                            <span className="text-subtle self-center text-[11px] font-semibold">
                              {extraSkillsLabel}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="border-line/70 flex items-center justify-between border-t pt-3 text-xs">
                      {item.isLocked ? (
                        <span className="text-warning font-bold">
                          {tStudents("locked")}
                        </span>
                      ) : (
                        <span className="text-success font-bold">
                          {tStudents("openCv")}
                        </span>
                      )}
                      <a
                        href={`/api/cv/${item.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary-soft text-primary-text hover:bg-primary hover:text-on-primary rounded-xl px-3.5 py-1.5 font-bold transition-colors"
                      >
                        {tStudents("viewPdf")}
                      </a>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
