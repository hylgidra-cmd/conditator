import { notFound } from "next/navigation";
import { db } from "@/backend/db";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/backend/format-date";
import { currentUser } from "@/backend/auth/current-user";
import { getApplyPassStatus } from "@/backend/payment/service";
import { ApplyModal } from "@/frontend/components/vacancy/apply-modal";
import { getTranslations } from "next-intl/server";

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
        },
      },
    },
  });

  if (!vacancy) notFound();

  // If student, check if they have CVs and if already applied
  let studentCvs: { id: string; title: string; savedAt: string | null }[] = [];
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
        select: { id: true, title: true, savedAt: true },
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Back button */}
      <div>
        <Link
          href="/vacancies"
          className="text-brand text-sm font-semibold hover:underline"
        >
          {t("back")}
        </Link>
      </div>

      {/* Main Vacancy Card */}
      <div className="border-border bg-surface space-y-6 rounded-3xl border p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs font-bold tracking-wider uppercase">
                {vacancy.company.name ?? ""}
              </span>
              {vacancy.company.industry && (
                <span className="text-muted text-xs">
                  {"· "}
                  {vacancy.company.industry}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {vacancy.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {vacancy.workType && (
                <span className="bg-brand-soft text-brand rounded-lg px-2.5 py-1 font-semibold">
                  {t(`workTypes.${vacancy.workType}` as "workTypes.FULL_TIME")}
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
                {t("postedAt", { date: formatDate(vacancy.createdAt) })}
              </span>
            </div>
          </div>

          {/* Salary */}
          <div className="text-left sm:text-right">
            {vacancy.salaryFrom || vacancy.salaryTo ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/80 px-4 py-2">
                <span className="block text-xs font-bold tracking-wider text-orange-600 uppercase">
                  {t("salary")}
                </span>
                <span className="text-brand text-xl font-black">
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
              <span className="text-muted text-sm font-medium">
                {t("salaryNegotiable")}
              </span>
            )}
          </div>
        </div>

        {/* Application CTA for Students */}
        {user?.role === "STUDENT" && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div>
              <h4 className="font-bold">{t("loginPromptTitle")}</h4>
              <p className="text-muted text-xs">{t("loginPromptDesc")}</p>
            </div>
            <Link
              href="/login"
              className="bg-brand text-brand-foreground rounded-xl px-5 py-2 text-sm font-bold shadow hover:opacity-95"
            >
              {t("login")}
            </Link>
          </div>
        )}

        {/* Requirements / Description */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t("descTitle")}</h2>
          {vacancy.rawText ? (
            <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-line">
              {vacancy.rawText}
            </div>
          ) : (
            <p className="text-muted text-sm">{t("noDesc")}</p>
          )}
        </div>

        {/* Skills */}
        {vacancy.skills.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase">
              {t("skillsTitle")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vacancy.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-brand-soft text-brand rounded-lg px-3 py-1 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {vacancy.languages.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase">
              {t("languagesTitle")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {vacancy.languages.map((lang) => (
                <span
                  key={lang}
                  className="border-border bg-surface rounded-lg border px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
