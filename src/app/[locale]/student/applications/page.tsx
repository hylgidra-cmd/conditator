import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Header");
  return { title: t("myApplications") };
}
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import { PlusIcon, ResumeIcon } from "@/frontend/components/icons";
import { Link, redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { getOwnCvs } from "@/backend/cv/service";
import { formatDate } from "@/backend/format-date";

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  VIEWED: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  INTERESTED: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  ACCEPTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const REVEAL_DELAYS = [0, 75, 150, 225] as const;

export default async function StudentApplicationsPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });

  const t = await getTranslations("StudentApplications");

  const [cvs, applications, conversations] = await Promise.all([
    getOwnCvs(user.id),
    db.vacancyApplication.findMany({
      where: { studentId: user.id },
      include: {
        vacancy: {
          include: {
            company: { select: { name: true } },
          },
        },
        cv: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.conversation.findMany({
      where: { studentId: user.id, vacancyId: { not: null } },
      select: { id: true, vacancyId: true },
    }),
  ]);
  const convByVacancy = new Map(
    conversations
      .filter((c): c is { id: string; vacancyId: string } =>
        Boolean(c.vacancyId),
      )
      .map((c) => [c.vacancyId, c.id]),
  );

  return (
    <div className="page-x font-ui space-y-8 py-8 sm:py-12">
      {/* Header + Stats Bento */}
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-h2 text-text font-extrabold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-subtle mt-1 text-sm">{t("subtitle")}</p>
            </div>
            <Link
              href="/student/cv?new=1"
              className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
            >
              <PlusIcon size={15} />
              {t("createNewCv")}
            </Link>
          </div>

          <dl className="border-line/80 relative z-10 mt-6 grid grid-cols-2 gap-4 border-t pt-5 sm:max-w-md">
            <div>
              <dd className="text-primary-text text-2xl font-extrabold sm:text-3xl">
                <AnimatedNumber value={cvs.length} />
              </dd>
              <dt className="text-subtle text-xs font-semibold">
                {t("cvsSection")}
              </dt>
            </div>
            <div>
              <dd className="text-text text-2xl font-extrabold sm:text-3xl">
                <AnimatedNumber value={applications.length} />
              </dd>
              <dt className="text-subtle text-xs font-semibold">
                {t("applicationsSection")}
              </dt>
            </div>
          </dl>
        </div>
      </Reveal>

      {/* Section 1: My CVs */}
      <section className="space-y-4">
        <h2 className="text-text text-lg font-extrabold">{t("cvsSection")}</h2>
        {cvs.length === 0 ? (
          <Reveal>
            <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
              <ResumeIcon size={28} className="text-subtle mx-auto mb-3" />
              <p className="text-subtle text-sm">{t("noCvs")}</p>
              <Link
                href="/student/cv"
                className="bg-primary text-on-primary shadow-primary mt-4 inline-block rounded-2xl px-5 py-2.5 text-xs font-bold"
              >
                {t("createNewCv")}
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv, idx) => (
              <Reveal key={cv.id} delay={REVEAL_DELAYS[idx % 4]}>
                <div className="border-line bg-card/90 shadow-soft hover:shadow-float hover:border-primary/45 flex h-full flex-col justify-between gap-4 rounded-3xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-text text-base font-extrabold">
                        {cv.title || `CV #${idx + 1}`}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          cv.isPaid
                            ? "bg-success-soft text-success"
                            : "bg-warning-soft text-warning"
                        }`}
                      >
                        {cv.isPaid ? t("paid") : t("unpaid")}
                      </span>
                    </div>

                    <div className="text-subtle flex flex-wrap items-center gap-2 text-xs">
                      <span className="uppercase">{cv.language}</span>
                      <span>·</span>
                      <span>{cv.isVisible ? t("visible") : t("hidden")}</span>
                      <span>·</span>
                      <span>
                        {t("appliedCount", { count: cv._count.applications })}
                      </span>
                    </div>

                    {cv.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cv.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="border-line bg-card-cool text-text rounded-lg border px-2 py-0.5 text-[10px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-line/70 flex items-center gap-2 border-t pt-3">
                    <Link
                      href={`/student/cv?cvId=${cv.id}`}
                      className="border-line bg-canvas text-text hover:border-primary flex-1 rounded-xl border py-2 text-center text-xs font-bold transition-colors"
                    >
                      {t("editCv")}
                    </Link>
                    <a
                      href={`/api/cv/me/pdf?cvId=${encodeURIComponent(cv.id)}`}
                      className="bg-primary-soft text-primary-text hover:bg-primary hover:text-on-primary rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                    >
                      {t("downloadPdf")}
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Submitted Applications */}
      <section className="space-y-4">
        <h2 className="text-text text-lg font-extrabold">
          {t("applicationsSection")}
        </h2>
        {applications.length === 0 ? (
          <Reveal>
            <div className="border-line bg-card/85 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
              <p className="text-subtle text-sm">{t("noApplications")}</p>
              <Link
                href="/vacancies"
                className="bg-primary text-on-primary shadow-primary mt-4 inline-block rounded-2xl px-5 py-2.5 text-xs font-bold"
              >
                {t("browseVacancies")}
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-3.5">
            {applications.map((app, idx) => (
              <Reveal key={app.id} delay={REVEAL_DELAYS[idx % 4]}>
                <div className="border-line bg-card/90 shadow-soft hover:shadow-float hover:border-primary/40 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-subtle text-xs font-bold uppercase">
                        {app.vacancy.company.name ?? ""}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          STATUS_BADGE[app.status] ??
                          "bg-card-cool text-text"
                        }`}
                      >
                        {t(`statuses.${app.status}` as "statuses.SUBMITTED")}
                      </span>
                    </div>
                    <h3 className="text-text text-base font-extrabold">
                      {app.vacancy.title}
                    </h3>
                    <div className="text-subtle flex flex-wrap items-center gap-3 text-xs">
                      <span>
                        {t("cvUsed", { title: app.cv.title || "CV" })}
                      </span>
                      <span>·</span>
                      <span>{formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/vacancies/${app.vacancyId}`}
                      className="border-line bg-canvas text-text hover:border-primary rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                    >
                      {t("openVacancy")}
                    </Link>
                    {convByVacancy.get(app.vacancyId) ? (
                      <Link
                        href={`/chat?id=${convByVacancy.get(app.vacancyId)}`}
                        className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-xl px-4 py-2 text-xs font-bold transition-all"
                      >
                        {t("openChat")}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
