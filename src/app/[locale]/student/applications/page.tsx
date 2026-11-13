import { getLocale, getTranslations } from "next-intl/server";
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

export default async function StudentApplicationsPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "STUDENT") return redirect({ href: "/account", locale });

  const t = await getTranslations("StudentApplications");

  const [cvs, applications] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Link
          href="/student/cv?new=1"
          className="bg-brand text-brand-foreground rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-opacity hover:opacity-95"
        >
          {t("createNewCv")}
        </Link>
      </div>

      {/* Section 1: My CVs */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">{t("cvsSection")}</h2>
        {cvs.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-8 text-center">
            <p className="text-muted text-sm">{t("noCvs")}</p>
            <Link
              href="/student/cv"
              className="bg-brand text-brand-foreground mt-4 inline-block rounded-xl px-5 py-2 text-xs font-bold"
            >
              {t("createNewCv")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv, idx) => (
              <div
                key={cv.id}
                className="border-border bg-surface flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-foreground text-base font-bold">
                      {cv.title || `CV #${idx + 1}`}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        cv.isPaid
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {cv.isPaid ? t("paid") : t("unpaid")}
                    </span>
                  </div>

                  <div className="text-muted flex flex-wrap items-center gap-2 text-xs">
                    <span className="uppercase">{cv.language}</span>
                    <span>·</span>
                    <span>{cv.isVisible ? t("visible") : t("hidden")}</span>
                    <span>·</span>
                    <span>
                      {t("appliedCount", { count: cv._count.applications })}
                    </span>
                  </div>

                  {cv.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cv.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="bg-muted/20 text-muted rounded-md px-2 py-0.5 text-[10px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-border/60 flex items-center gap-2 border-t pt-3">
                  <Link
                    href={`/student/cv?cvId=${cv.id}`}
                    className="border-border bg-surface text-foreground hover:border-brand flex-1 rounded-xl border py-2 text-center text-xs font-bold transition-colors"
                  >
                    {t("editCv")}
                  </Link>
                  <a
                    href={`/api/cv/${cv.id}/pdf`}
                    className="bg-brand/10 text-brand hover:bg-brand/20 rounded-xl px-4 py-2 text-xs font-bold transition-colors"
                  >
                    {t("downloadPdf")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Submitted Applications */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">{t("applicationsSection")}</h2>
        {applications.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-8 text-center">
            <p className="text-muted text-sm">{t("noApplications")}</p>
            <Link
              href="/vacancies"
              className="bg-brand text-brand-foreground mt-4 inline-block rounded-xl px-5 py-2 text-xs font-bold"
            >
              {t("browseVacancies")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border-border bg-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted text-xs font-bold uppercase">
                      {app.vacancy.company.name ?? ""}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        STATUS_BADGE[app.status] ??
                        "bg-muted/20 text-foreground"
                      }`}
                    >
                      {t(`statuses.${app.status}` as "statuses.SUBMITTED")}
                    </span>
                  </div>
                  <h3 className="text-foreground text-base font-bold">
                    {app.vacancy.title}
                  </h3>
                  <div className="text-muted flex flex-wrap items-center gap-3 text-xs">
                    <span>{t("cvUsed", { title: app.cv.title || "CV" })}</span>
                    <span>·</span>
                    <span>{formatDate(app.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/vacancies/${app.vacancyId}`}
                    className="border-border bg-surface text-foreground hover:border-brand rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                  >
                    {t("openVacancy")}
                  </Link>
                  <Link
                    href="/chat"
                    className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-opacity hover:opacity-95"
                  >
                    {t("openChat")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
