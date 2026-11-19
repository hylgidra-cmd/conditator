import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { getApplyPassStatus } from "@/backend/payment/service";
import { Reveal } from "@/frontend/components/ds/motion";
import { ArrowLeftIcon } from "@/frontend/components/icons";
import { ApplyModal } from "@/frontend/components/vacancy/apply-modal";
import { Link } from "@/i18n/navigation";

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  const t = await getTranslations("VacancyDetail");

  const vacancy = await db.vacancy.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoPath: true,
          industry: true,
          size: true,
          country: true,
          approval: true,
          user: { select: { status: true } },
        },
      },
    },
  });

  if (
    !vacancy ||
    vacancy.status !== "ACTIVE" ||
    vacancy.company.approval !== "APPROVED" ||
    vacancy.company.user.status !== "ACTIVE" ||
    (vacancy.expiresAt && vacancy.expiresAt <= new Date())
  ) {
    notFound();
  }

  // If student, check if they have CVs and if already applied
  let studentCvs: {
    id: string;
    title: string;
    savedAt: string | null;
    isPaid: boolean;
  }[] = [];
  let existingApplication = null;
  let existingConversation = null;
  let passStatus: {
    canApply: boolean;
    hasActivePass: boolean;
    freeTrialAvailable: boolean;
    applyPassUntil: string | null;
  } = {
    canApply: false,
    hasActivePass: false,
    freeTrialAvailable: false,
    applyPassUntil: null,
  };

  if (user && user.role === "STUDENT") {
    const [cvs, app, conv, pass] = await Promise.all([
      db.cv.findMany({
        where: { userId: user.id, savedAt: { not: null } },
        select: { id: true, title: true, savedAt: true, isPaid: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.vacancyApplication.findFirst({
        where: { vacancyId: vacancy.id, studentId: user.id },
      }),
      db.conversation.findFirst({
        where: {
          vacancyId: vacancy.id,
          studentId: user.id,
          companyId: vacancy.companyId,
        },
      }),
      getApplyPassStatus(user.id),
    ]);
    studentCvs = cvs.map((c) => ({
      id: c.id,
      title: c.title,
      savedAt: c.savedAt?.toISOString() ?? null,
      isPaid: c.isPaid,
    }));
    existingApplication = app;
    existingConversation = conv;
    passStatus = {
      canApply: pass.canApply,
      hasActivePass: pass.hasActivePass,
      freeTrialAvailable: pass.freeTrialAvailable,
      applyPassUntil: pass.applyPassUntil?.toISOString() ?? null,
    };
  }

  return (
    <div className="page-x font-ui max-w-4xl space-y-6 py-8 sm:py-12">
      {/* Back button */}
      <Reveal>
        <div>
          <Link
            href="/vacancies"
            className="border-line bg-card/85 text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-colors"
          >
            <ArrowLeftIcon size={14} />
            {t("back")}
          </Link>
        </div>
      </Reveal>

      {/* Main Vacancy Card */}
      <Reveal delay={75}>
        <div className="border-line bg-card/90 shadow-float relative space-y-6 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />

          <div className="border-line relative z-10 flex flex-wrap items-start justify-between gap-4 border-b pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-subtle text-xs font-bold tracking-wider uppercase">
                  {vacancy.company.name ?? ""}
                </span>
                {vacancy.company.industry && (
                  <span className="text-subtle text-xs">
                    {"· "}
                    {vacancy.company.industry}
                  </span>
                )}
              </div>
              <h1 className="text-h2 text-text font-extrabold tracking-tight">
                {vacancy.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {vacancy.workType && (
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 font-bold">
                    {t(`workTypes.${vacancy.workType}` as "workTypes.FULL_TIME")}
                  </span>
                )}
                {vacancy.location && (
                  <span className="border-line bg-canvas text-text rounded-full border px-3 py-1 font-semibold">
                    {t("location", { location: vacancy.location })}
                  </span>
                )}
                {vacancy.minExperienceYears !== null && (
                  <span className="border-line bg-canvas text-text rounded-full border px-3 py-1 font-semibold">
                    {vacancy.minExperienceYears > 0
                      ? t("experience", { years: vacancy.minExperienceYears })
                      : t("noExperience")}
                  </span>
                )}
                <span className="text-subtle ml-auto font-medium">
                  {t("postedAt", { date: formatDate(vacancy.createdAt) })}
                </span>
              </div>
            </div>

            {/* Salary */}
            <div className="text-left sm:text-right">
              {vacancy.salaryFrom || vacancy.salaryTo ? (
                <div className="border-primary/25 bg-primary/8 rounded-2xl border px-4 py-2.5">
                  <span className="text-primary block text-xs font-bold tracking-wider uppercase">
                    {t("salary")}
                  </span>
                  <span className="text-text text-xl font-black">
                    {vacancy.salaryFrom
                      ? `${vacancy.salaryFrom.toLocaleString()} `
                      : ""}
                    {vacancy.salaryTo
                      ? `– ${vacancy.salaryTo.toLocaleString()} `
                      : ""}
                    {vacancy.currency}
                  </span>
                </div>
              ) : (
                <span className="text-subtle text-sm font-medium">
                  {t("salaryNegotiable")}
                </span>
              )}
            </div>
          </div>

          {/* Application CTA for Students */}
          {user?.role === "STUDENT" && (
            <div className="border-line bg-canvas/70 relative z-10 rounded-2xl border p-5">
              <ApplyModal
                vacancyId={vacancy.id}
                studentCvs={studentCvs}
                alreadyApplied={Boolean(existingApplication)}
                applicationStatus={existingApplication?.status}
                conversationId={existingConversation?.id}
                canApply={passStatus.canApply}
                hasActivePass={passStatus.hasActivePass}
                freeTrialAvailable={passStatus.freeTrialAvailable}
                applyPassUntil={passStatus.applyPassUntil}
              />
            </div>
          )}

          {!user && (
            <div className="border-line bg-canvas/70 relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5">
              <div>
                <h4 className="text-text font-extrabold">
                  {t("loginPromptTitle")}
                </h4>
                <p className="text-subtle text-xs">{t("loginPromptDesc")}</p>
              </div>
              <Link
                href="/login"
                className="bg-primary text-on-primary shadow-primary hover:bg-primary-hover rounded-2xl px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
              >
                {t("login")}
              </Link>
            </div>
          )}

          {/* Requirements / Description */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-text text-lg font-extrabold">
              {t("descTitle")}
            </h2>
            {vacancy.rawText ? (
              <div className="text-text/90 text-sm leading-relaxed whitespace-pre-line">
                {vacancy.rawText}
              </div>
            ) : (
              <p className="text-subtle text-sm">{t("noDesc")}</p>
            )}
          </div>

          {/* Skills */}
          {vacancy.skills.length > 0 && (
            <div className="border-line relative z-10 space-y-2.5 border-t pt-4">
              <h3 className="text-subtle text-xs font-bold tracking-wider uppercase">
                {t("skillsTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {vacancy.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {vacancy.languages.length > 0 && (
            <div className="border-line relative z-10 space-y-2.5 border-t pt-4">
              <h3 className="text-subtle text-xs font-bold tracking-wider uppercase">
                {t("languagesTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {vacancy.languages.map((lang) => (
                  <span
                    key={lang}
                    className="border-line bg-canvas text-text rounded-full border px-3 py-1 text-xs font-semibold"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
