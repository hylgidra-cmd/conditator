import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { LogoutButton } from "@/frontend/components/auth/logout-button";
import { AnimatedNumber, Reveal } from "@/frontend/components/ds/motion";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  MailIcon,
  MessageIcon,
  ResumeIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "@/frontend/components/icons";
import { Link, redirect } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account");
  return { title: t("title") };
}

const APPROVAL_TONE = {
  PENDING: "border-primary/30 bg-primary-soft text-primary-text",
  APPROVED: "border-emerald-500/30 bg-success-soft text-success",
  REJECTED: "border-red-500/30 bg-danger-soft text-danger",
} as const;

export default async function AccountPage() {
  const sessionUser = await currentUser();
  const locale = await getLocale();
  if (!sessionUser) return redirect({ href: "/login", locale });

  const [account, t, tCompany] = await Promise.all([
    db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        locale: true,
        applyPassUntil: true,
        createdAt: true,
        cvs: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { title: true },
        },
        company: {
          select: {
            id: true,
            name: true,
            approval: true,
            subscriptionUntil: true,
            _count: { select: { vacancies: true } },
          },
        },
        _count: {
          select: { cvs: true, applications: true },
        },
      },
    }),
    getTranslations("Account"),
    getTranslations("Company"),
  ]);

  if (!account) return redirect({ href: "/login", locale });

  const now = new Date();
  const applyPassActive = Boolean(
    account.applyPassUntil && account.applyPassUntil > now,
  );
  const companySubActive = Boolean(
    account.company?.subscriptionUntil &&
      account.company.subscriptionUntil > now,
  );

  const displayName =
    account.role === "COMPANY"
      ? account.company?.name || account.email
      : account.cvs[0]?.title || account.email;

  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="page-x font-ui max-w-5xl space-y-6 py-8 sm:py-12">
      <Reveal>
        <div className="border-line bg-card/85 shadow-float relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
          <div
            aria-hidden
            className="bg-primary/12 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-on-primary shadow-primary flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold sm:size-16 sm:text-2xl">
                {avatarInitial}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-0.5 text-xs font-bold">
                    {t(`roles.${account.role}`)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      account.emailVerifiedAt
                        ? "border-emerald-500/30 bg-success-soft text-success"
                        : "border-primary/30 bg-primary-soft text-primary-text"
                    }`}
                  >
                    {account.emailVerifiedAt ? <CheckIcon size={12} /> : null}
                    {account.emailVerifiedAt ? t("verified") : t("unverified")}
                  </span>
                </div>
                <h1 className="text-h2 text-text mt-1.5 font-extrabold tracking-tight">
                  {displayName}
                </h1>
                <p className="text-subtle text-sm">{account.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/change-password"
                className="border-line bg-canvas text-text hover:border-primary inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors"
              >
                <SettingsIcon size={15} />
                {t("resetPassword")}
              </Link>
              <LogoutButton className="border-line bg-card-cool/60 text-danger hover:border-danger/40 hover:bg-danger-soft inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors" />
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal delay={75} className="lg:col-span-7">
          <section className="border-line bg-card/90 shadow-soft h-full space-y-5 rounded-3xl border p-6 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <UserIcon size={18} />
              </div>
              <div>
                <h2 className="text-text text-lg font-extrabold">
                  {t("profileInfo")}
                </h2>
                <p className="text-subtle text-xs">{t("subtitle")}</p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle flex items-center gap-1.5 text-xs font-semibold">
                  <UserIcon size={13} />
                  {t("name")}
                </dt>
                <dd className="text-text mt-1.5 truncate text-sm font-bold">
                  {displayName}
                </dd>
              </div>

              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle flex items-center gap-1.5 text-xs font-semibold">
                  <MailIcon size={13} />
                  {t("email")}
                </dt>
                <dd className="text-text mt-1.5 truncate text-sm font-bold">
                  {account.email}
                </dd>
              </div>

              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle text-xs font-semibold">
                  {t("role")}
                </dt>
                <dd className="text-text mt-1.5 text-sm font-bold">
                  {t(`roles.${account.role}`)}
                </dd>
              </div>

              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle text-xs font-semibold">
                  {t("status")}
                </dt>
                <dd className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                      account.status === "ACTIVE"
                        ? "border-emerald-500/30 bg-success-soft text-success"
                        : "border-red-500/30 bg-danger-soft text-danger"
                    }`}
                  >
                    {account.status === "ACTIVE"
                      ? t("statusActive")
                      : t("statusBlocked")}
                  </span>
                </dd>
              </div>

              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle text-xs font-semibold">
                  {t("locale")}
                </dt>
                <dd className="text-text mt-1.5 text-sm font-bold uppercase">
                  {account.locale}
                </dd>
              </div>

              <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                <dt className="text-subtle flex items-center gap-1.5 text-xs font-semibold">
                  <CalendarIcon size={13} />
                  {t("memberSince")}
                </dt>
                <dd className="text-text mt-1.5 text-sm font-bold">
                  {formatDate(account.createdAt)}
                </dd>
              </div>
            </dl>
          </section>
        </Reveal>

        <Reveal delay={150} className="lg:col-span-5">
          <section className="border-line bg-card/90 shadow-soft h-full space-y-5 rounded-3xl border p-6 backdrop-blur-md">
            {account.role === "STUDENT" ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                    <ResumeIcon size={18} />
                  </div>
                  <h2 className="text-text text-lg font-extrabold">
                    {t("studentStats")}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                    <p className="text-subtle text-xs font-semibold">
                      {t("cvsCount")}
                    </p>
                    <p className="text-text mt-1 text-2xl font-extrabold">
                      <AnimatedNumber value={account._count.cvs} />
                    </p>
                  </div>
                  <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                    <p className="text-subtle text-xs font-semibold">
                      {t("appsCount")}
                    </p>
                    <p className="text-text mt-1 text-2xl font-extrabold">
                      <AnimatedNumber value={account._count.applications} />
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    applyPassActive
                      ? "border-emerald-500/30 bg-success-soft text-success"
                      : "border-line bg-card-cool/50 text-subtle"
                  }`}
                >
                  <p className="text-xs font-bold">{t("applyPass")}</p>
                  <p className="mt-1 text-sm font-semibold">
                    {applyPassActive && account.applyPassUntil
                      ? t("applyPassActive", {
                          date: formatDate(account.applyPassUntil),
                        })
                      : t("applyPassInactive")}
                  </p>
                </div>
              </>
            ) : account.role === "COMPANY" && account.company ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                    <BuildingIcon size={18} />
                  </div>
                  <h2 className="text-text text-lg font-extrabold">
                    {t("companyStats")}
                  </h2>
                </div>

                <div className="border-line bg-canvas/70 rounded-2xl border p-4">
                  <p className="text-subtle text-xs font-semibold">
                    {t("companyVacancies")}
                  </p>
                  <p className="text-text mt-1 text-2xl font-extrabold">
                    <AnimatedNumber value={account.company._count.vacancies} />
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${APPROVAL_TONE[account.company.approval]}`}
                >
                  <p className="text-xs font-bold">{t("companyApproval")}</p>
                  <p className="mt-1 text-sm font-semibold">
                    {tCompany(`status.${account.company.approval}`)}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    companySubActive
                      ? "border-emerald-500/30 bg-success-soft text-success"
                      : "border-line bg-card-cool/50 text-subtle"
                  }`}
                >
                  <p className="text-xs font-bold">{t("companySub")}</p>
                  <p className="mt-1 text-sm font-semibold">
                    {companySubActive && account.company.subscriptionUntil
                      ? t("companySubActive", {
                          date: formatDate(account.company.subscriptionUntil),
                        })
                      : t("companySubInactive")}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                  <SettingsIcon size={18} />
                </div>
                <h2 className="text-text text-lg font-extrabold">
                  {t("roles.ADMIN")}
                </h2>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <p className="text-subtle text-xs font-bold uppercase tracking-wider">
                {t("quickActions")}
              </p>

              {account.role === "STUDENT" ? (
                <div className="grid gap-2">
                  <Link
                    href="/student/cv"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <ResumeIcon size={16} className="text-primary" />
                      {t("cvLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                  <Link
                    href="/student/applications"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <BriefcaseIcon size={16} className="text-primary" />
                      {t("applicationsLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                  <Link
                    href="/vacancies"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <BriefcaseIcon size={16} className="text-primary" />
                      {t("vacanciesLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                </div>
              ) : account.role === "COMPANY" ? (
                <div className="grid gap-2">
                  <Link
                    href="/company"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <BuildingIcon size={16} className="text-primary" />
                      {t("companyLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                  <Link
                    href="/company/students"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <UsersIcon size={16} className="text-primary" />
                      {t("studentsLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                  <Link
                    href="/company/billing"
                    className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <BriefcaseIcon size={16} className="text-primary" />
                      {t("billingLink")}
                    </span>
                    <ArrowRightIcon size={15} className="text-subtle" />
                  </Link>
                </div>
              ) : (
                <Link
                  href="/admin"
                  className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <SettingsIcon size={16} className="text-primary" />
                    {t("adminLink")}
                  </span>
                  <ArrowRightIcon size={15} className="text-subtle" />
                </Link>
              )}

              <Link
                href="/chat"
                className="border-line bg-canvas hover:border-primary text-text flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <MessageIcon size={16} className="text-primary" />
                  {t("chatLink")}
                </span>
                <ArrowRightIcon size={15} className="text-subtle" />
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
