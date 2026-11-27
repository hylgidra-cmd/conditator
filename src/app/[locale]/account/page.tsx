import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/backend/auth/current-user";
import { getUnreadMessageCount } from "@/backend/chat/unread";
import { maskName, parsePrivacy } from "@/backend/cv/privacy";
import { db } from "@/backend/db";
import { formatDate } from "@/backend/format-date";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import {
  EmployerAccountDashboard,
  type EmployerApplicantRow,
  type EmployerMessageRow,
  type EmployerVacancyRow,
} from "@/frontend/components/account/employer-account-dashboard";
import {
  StudentAccountDashboard,
  type StudentApplicationRow,
  type StudentRecentMessageRow,
  type StudentSavedVacancyRow,
} from "@/frontend/components/account/student-account-dashboard";
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
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "@/frontend/components/icons";
import { ClientMessages } from "@/i18n/client-messages";
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

type CvEducationItem = {
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
};

type CvJsonSubset = {
  fullName?: string | null;
  photo?: string | null;
  location?: string | null;
  skills?: string[];
  contact?: { phone?: string | null };
  education?: CvEducationItem[];
};

function summarizeCvEducation(edu?: CvEducationItem): string {
  if (!edu) return "";
  const degreeField = [edu.degree?.trim(), edu.field?.trim()]
    .filter(Boolean)
    .join(", ");
  const inst = edu.institution?.trim() ?? "";
  if (degreeField && inst) return `${degreeField} (${inst})`;
  return degreeField || inst;
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatMessageTime(
  date: Date,
  now: Date,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfMsg = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000,
  );
  if (diffDays === 0) return todayLabel;
  if (diffDays === 1) return yesterdayLabel;
  return formatDate(date);
}

export default async function AccountPage() {
  const sessionUser = await currentUser();
  const locale = await getLocale();
  if (!sessionUser) return redirect({ href: "/login", locale });

  // ================= STUDENT CABINET (NEW STUDIO FULL-STACK DASHBOARD) =================
  if (sessionUser.role === "STUDENT") {
    const [
      student,
      appGroups,
      recentApps,
      savedRows,
      unreadMessages,
      pendingPassRow,
      conversations,
      supportThread,
      tStudent,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          emailVerifiedAt: true,
          applyPassUntil: true,
          fullName: true,
          phone: true,
          city: true,
          educationSummary: true,
          avatarUrl: true,
          createdAt: true,
          cvs: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              id: true,
              title: true,
              data: true,
              privacy: true,
              isVisible: true,
              isPaid: true,
              savedAt: true,
              skills: true,
              location: true,
              updatedAt: true,
            },
          },
        },
      }),
      db.vacancyApplication.groupBy({
        by: ["status"],
        where: { studentId: sessionUser.id },
        _count: { _all: true },
      }),
      db.vacancyApplication.findMany({
        where: { studentId: sessionUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          vacancyId: true,
          status: true,
          createdAt: true,
          vacancy: {
            select: {
              title: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  hasLogo: true,
                },
              },
            },
          },
        },
      }),
      db.savedVacancy.findMany({
        where: { userId: sessionUser.id, vacancy: { status: "ACTIVE" } },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          vacancyId: true,
          vacancy: {
            select: {
              title: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  hasLogo: true,
                },
              },
            },
          },
        },
      }),
      getUnreadMessageCount(sessionUser.id, "STUDENT"),
      db.payment.findFirst({
        where: {
          userId: sessionUser.id,
          purpose: "WEEKLY_APPLY_PASS",
          status: "PENDING",
        },
        select: { id: true },
      }),
      db.conversation.findMany({
        where: { studentId: sessionUser.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          id: true,
          updatedAt: true,
          company: { select: { name: true } },
          vacancy: { select: { title: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              fileName: true,
              senderId: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      }),
      db.supportThread.findUnique({
        where: { userId: sessionUser.id },
        select: {
          id: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              senderId: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      }),
      getTranslations("StudentAccount"),
    ]);

    if (!student) return redirect({ href: "/login", locale });

    const now = new Date();
    const latestCv = student.cvs[0] ?? null;
    const cvData = (latestCv?.data as CvJsonSubset | null) ?? null;

    const resolvedFullName =
      student.fullName?.trim() || cvData?.fullName?.trim() || "";
    const resolvedPhone =
      student.phone?.trim() || cvData?.contact?.phone?.trim() || "";
    const resolvedCity =
      student.city?.trim() ||
      latestCv?.location?.trim() ||
      cvData?.location?.trim() ||
      "";
    const resolvedEducation =
      student.educationSummary?.trim() ||
      summarizeCvEducation(cvData?.education?.[0]);
    const resolvedAvatar = student.avatarUrl || cvData?.photo || null;

    const hasSkills = Boolean(
      (latestCv?.skills && latestCv.skills.length > 0) ||
        (cvData?.skills && cvData.skills.length > 0),
    );

    // Arizalar hisoblagichi
    let submittedCount = 0;
    let inReviewCount = 0;
    let respondedCount = 0;
    for (const grp of appGroups) {
      const c = grp._count._all;
      if (grp.status === "SUBMITTED") submittedCount += c;
      else if (grp.status === "VIEWED") inReviewCount += c;
      else respondedCount += c;
    }
    const applicationsTotal = submittedCount + inReviewCount + respondedCount;

    // Haftalik ruxsatnoma
    const passActive = Boolean(
      student.applyPassUntil && student.applyPassUntil > now,
    );
    const daysLeft =
      passActive && student.applyPassUntil
        ? Math.max(
            1,
            Math.ceil(
              (student.applyPassUntil.getTime() - now.getTime()) / 86_400_000,
            ),
          )
        : 0;

    // CV karta nomi
    const rawCvTitle = latestCv?.title?.trim() || tStudent("cvCard.defaultFile");
    const cvFileName = rawCvTitle.toLowerCase().endsWith(".pdf")
      ? rawCvTitle
      : `${rawCvTitle}.pdf`;

    const recentApplicationRows: StudentApplicationRow[] = recentApps.map(
      (app) => ({
        id: app.id,
        vacancyId: app.vacancyId,
        companyId: app.vacancy.company.id,
        companyName:
          app.vacancy.company.name?.trim() || tStudent("unknownCompany"),
        companyHasLogo: app.vacancy.company.hasLogo,
        position: app.vacancy.title,
        status: app.status,
        dateLabel: formatDate(app.createdAt),
      }),
    );

    const savedVacancyRows: StudentSavedVacancyRow[] = savedRows.map((row) => ({
      vacancyId: row.vacancyId,
      title: row.vacancy.title,
      companyId: row.vacancy.company.id,
      companyName:
        row.vacancy.company.name?.trim() || tStudent("unknownCompany"),
      companyHasLogo: row.vacancy.company.hasLogo,
    }));

    // So'nggi xabarlar (Kompaniya suhbatlari + Qo'llab-quvvatlash suhbati)
    const todayLabel = tStudent("messagesCard.today");
    const yesterdayLabel = tStudent("messagesCard.yesterday");
    const rawMessageItems: Array<{
      sortAt: number;
      row: StudentRecentMessageRow;
    }> = [];

    for (const conv of conversations) {
      const lastMsg = conv.messages[0];
      if (!lastMsg) continue;
      const senderName =
        conv.company.name?.trim() || tStudent("unknownCompany");
      const snippetText =
        lastMsg.text.trim() || lastMsg.fileName || tStudent("messagesCard.attachment");
      rawMessageItems.push({
        sortAt: lastMsg.createdAt.getTime(),
        row: {
          id: conv.id,
          href: `/chat?id=${encodeURIComponent(conv.id)}`,
          senderName,
          initials: makeInitials(senderName),
          subject: conv.vacancy?.title || tStudent("messagesCard.directSubject"),
          snippet: snippetText,
          timeLabel: formatMessageTime(
            lastMsg.createdAt,
            now,
            todayLabel,
            yesterdayLabel,
          ),
          unread: lastMsg.senderId !== student.id && lastMsg.readAt === null,
        },
      });
    }

    const lastSupportMsg = supportThread?.messages[0];
    if (supportThread && lastSupportMsg) {
      const supportName = tStudent("messagesCard.supportSender");
      rawMessageItems.push({
        sortAt: lastSupportMsg.createdAt.getTime(),
        row: {
          id: `support-${supportThread.id}`,
          href: "/support",
          senderName: supportName,
          initials: "CS",
          subject: tStudent("messagesCard.supportSubject"),
          snippet: lastSupportMsg.text.replace(/^\[IMG:[^\]]+\]\s*/, "").trim() ||
            tStudent("messagesCard.attachment"),
          timeLabel: formatMessageTime(
            lastSupportMsg.createdAt,
            now,
            todayLabel,
            yesterdayLabel,
          ),
          unread:
            lastSupportMsg.senderId !== student.id &&
            lastSupportMsg.readAt === null,
        },
      });
    }

    rawMessageItems.sort((a, b) => b.sortAt - a.sortAt);
    const recentMessageRows = rawMessageItems.slice(0, 3).map((x) => x.row);

    return (
      <ClientMessages namespaces={["StudentAccount"]}>
        <StudentAccountDashboard
          initialProfile={{
            fullName: resolvedFullName,
            email: student.email,
            phone: resolvedPhone,
            city: resolvedCity,
            educationSummary: resolvedEducation,
            avatarUrl: resolvedAvatar,
          }}
          initialPrivacy={{
            cvId: latestCv?.id ?? null,
            hasSavedCv: Boolean(latestCv?.savedAt),
            isPaidCv: Boolean(latestCv?.isPaid),
            isVisible: Boolean(latestCv?.isVisible),
            privacy: parsePrivacy(latestCv?.privacy),
          }}
          emailVerified={Boolean(student.emailVerifiedAt)}
          accountCreatedLabel={formatDate(student.createdAt)}
          hasSkills={hasSkills}
          cvInfo={{
            id: latestCv?.id ?? null,
            fileName: cvFileName,
            updatedLabel: latestCv ? formatDate(latestCv.updatedAt) : null,
            hasSavedCv: Boolean(latestCv?.savedAt),
          }}
          stats={{
            applicationsTotal,
            unreadMessages,
            submitted: submittedCount,
            inReview: inReviewCount,
            responded: respondedCount,
          }}
          applyPass={{
            active: passActive,
            daysLeft,
            pendingPayment: Boolean(pendingPassRow),
          }}
          recentApplications={recentApplicationRows}
          initialSavedVacancies={savedVacancyRows}
          recentMessages={recentMessageRows}
        />
      </ClientMessages>
    );
  }

  // ================= EMPLOYER / COMPANY CABINET (NEW STUDIO FULL-STACK DASHBOARD) =================
  if (sessionUser.role === "COMPANY") {
    const existingCompany = await db.company.findFirst({
      where: {
        OR: [
          { userId: sessionUser.id },
          { members: { some: { userId: sessionUser.id } } },
        ],
      },
      select: {
        id: true,
        name: true,
        industry: true,
        city: true,
        country: true,
        website: true,
        contactEmail: true,
        contactPerson: true,
        size: true,
        description: true,
        hasLogo: true,
        approval: true,
        approvedAt: true,
        subscriptionUntil: true,
        updatedAt: true,
      },
    });

    const company =
      existingCompany ??
      (await db.company.upsert({
        where: { userId: sessionUser.id },
        create: { userId: sessionUser.id },
        update: {},
        select: {
          id: true,
          name: true,
          industry: true,
          city: true,
          country: true,
          website: true,
          contactEmail: true,
          contactPerson: true,
          size: true,
          description: true,
          hasLogo: true,
          approval: true,
          approvedAt: true,
          subscriptionUntil: true,
          updatedAt: true,
        },
      }));

    const [
      employerUser,
      vacancies,
      totalActiveVacancies,
      appGroups,
      stageGroups,
      recentApps,
      unreadMessages,
      pendingSubRow,
      latestCompletedSub,
      isUnlockedOrSub,
      conversations,
      supportThread,
      tEmployer,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: sessionUser.id },
        select: { email: true, twoFactorEnabled: true },
      }),
      db.vacancy.findMany({
        where: {
          companyId: company.id,
          status: { in: ["ACTIVE", "CLOSED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          location: true,
          workType: true,
          status: true,
        },
      }),
      db.vacancy.count({
        where: { companyId: company.id, status: "ACTIVE" },
      }),
      db.vacancyApplication.groupBy({
        by: ["status"],
        where: { vacancy: { companyId: company.id } },
        _count: { _all: true },
      }),
      db.candidateStage.groupBy({
        by: ["stage"],
        where: { companyId: company.id },
        _count: { _all: true },
      }),
      db.vacancyApplication.findMany({
        where: { vacancy: { companyId: company.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          vacancyId: true,
          cvId: true,
          status: true,
          createdAt: true,
          vacancy: {
            select: {
              title: true,
              stages: {
                select: { cvId: true, stage: true },
              },
            },
          },
          cv: {
            select: {
              skills: true,
              privacy: true,
              data: true,
            },
          },
        },
      }),
      getUnreadMessageCount(sessionUser.id, "COMPANY"),
      db.payment.findFirst({
        where: {
          companyId: company.id,
          purpose: "VACANCY_UNLOCK",
          status: "PENDING",
        },
        select: { id: true },
      }),
      db.payment.findFirst({
        where: {
          companyId: company.id,
          purpose: "VACANCY_UNLOCK",
          status: "COMPLETED",
        },
        orderBy: { createdAt: "desc" },
        select: { transactionDetails: true },
      }),
      isCompanySubscribedOrUnlocked(company.id),
      db.conversation.findMany({
        where: { companyId: company.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          id: true,
          studentId: true,
          updatedAt: true,
          vacancy: { select: { title: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              fileName: true,
              senderId: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      }),
      db.supportThread.findUnique({
        where: { userId: sessionUser.id },
        select: {
          id: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              senderId: true,
              readAt: true,
              createdAt: true,
            },
          },
        },
      }),
      getTranslations("EmployerAccount"),
    ]);

    if (!employerUser) return redirect({ href: "/login", locale });

    const now = new Date();
    const subActive = Boolean(
      (company.subscriptionUntil && company.subscriptionUntil > now) ||
        isUnlockedOrSub,
    );

    // Pipeline hisoblagichlari
    let newCount = 0;
    let inReviewCount = 0;
    let interviewCount = 0;
    let decisionCount = 0;

    for (const g of appGroups) {
      const c = g._count._all;
      if (g.status === "SUBMITTED") newCount += c;
      else if (g.status === "VIEWED") inReviewCount += c;
      else if (g.status === "INTERESTED") interviewCount += c;
      else decisionCount += c;
    }

    // Agar CandidateStage orqali INTERVIEW/ACCEPTED/REJECTED belgilangan bo'lsa, ularni ham hisobga olamiz
    let stageInterview = 0;
    let stageDecision = 0;
    for (const sg of stageGroups) {
      if (sg.stage === "INTERVIEW") stageInterview += sg._count._all;
      else if (sg.stage === "ACCEPTED" || sg.stage === "REJECTED") {
        stageDecision += sg._count._all;
      }
    }
    interviewCount = Math.max(interviewCount, stageInterview);
    decisionCount = Math.max(decisionCount, stageDecision);

    const vacancyRows: EmployerVacancyRow[] = vacancies.map((v) => ({
      id: v.id,
      title: v.title,
      location: v.location,
      workType: v.workType,
      status: v.status,
    }));

    const applicantRows: EmployerApplicantRow[] = recentApps.map((app) => {
      const cvJson = (app.cv.data as CvJsonSubset | null) ?? null;
      const priv = parsePrivacy(app.cv.privacy);
      const rawName = cvJson?.fullName?.trim() || "";
      const visibleName =
        subActive && !priv.hideName && rawName ? rawName : maskName(rawName);

      const matchedStage = app.vacancy.stages.find(
        (s) => s.cvId === app.cvId,
      )?.stage;

      let stageBadge: EmployerApplicantRow["stageBadge"] = "NEW";
      if (matchedStage === "INTERVIEW" || app.status === "INTERESTED") {
        stageBadge = "INTERVIEW";
      } else if (matchedStage === "ACCEPTED" || app.status === "ACCEPTED") {
        stageBadge = "ACCEPTED";
      } else if (matchedStage === "REJECTED" || app.status === "REJECTED") {
        stageBadge = "REJECTED";
      } else if (
        matchedStage === "REVIEWING" ||
        matchedStage === "LIKED" ||
        app.status === "VIEWED"
      ) {
        stageBadge = "IN_REVIEW";
      }

      const rawSkills =
        app.cv.skills && app.cv.skills.length > 0
          ? app.cv.skills
          : (cvJson?.skills ?? []);

      return {
        id: app.id,
        vacancyId: app.vacancyId,
        cvId: app.cvId,
        applicantName: visibleName,
        initials: makeInitials(visibleName),
        roleTitle: app.vacancy.title,
        skills: rawSkills.slice(0, 2),
        appliedDateLabel: formatDate(app.createdAt),
        stageBadge,
      };
    });

    // Suhbatdagi nomzod ismlarini xavfsiz (maskName) olish
    const studentIds = [...new Set(conversations.map((c) => c.studentId))];
    const studentUsers =
      studentIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: studentIds } },
            select: {
              id: true,
              fullName: true,
              cvs: {
                orderBy: { updatedAt: "desc" },
                take: 1,
                select: { data: true },
              },
            },
          })
        : [];
    const studentNameMap = new Map<string, string>();
    for (const su of studentUsers) {
      const suCv = (su.cvs[0]?.data as CvJsonSubset | null) ?? null;
      const raw = su.fullName?.trim() || suCv?.fullName?.trim() || "";
      studentNameMap.set(su.id, maskName(raw));
    }

    const todayLabel = tEmployer("messagesCard.today");
    const yesterdayLabel = tEmployer("messagesCard.yesterday");
    const rawMsgList: Array<{ sortAt: number; row: EmployerMessageRow }> = [];

    for (const conv of conversations) {
      const lastMsg = conv.messages[0];
      if (!lastMsg) continue;
      const candName =
        studentNameMap.get(conv.studentId) ?? tEmployer("candidateFallback");
      const snippetText =
        lastMsg.text.trim() ||
        lastMsg.fileName ||
        tEmployer("messagesCard.attachment");
      rawMsgList.push({
        sortAt: lastMsg.createdAt.getTime(),
        row: {
          id: conv.id,
          href: `/chat?id=${encodeURIComponent(conv.id)}`,
          senderName: candName,
          initials: makeInitials(candName),
          subject:
            conv.vacancy?.title || tEmployer("messagesCard.directSubject"),
          snippet: snippetText,
          timeLabel: formatMessageTime(
            lastMsg.createdAt,
            now,
            todayLabel,
            yesterdayLabel,
          ),
          unread:
            lastMsg.senderId !== sessionUser.id && lastMsg.readAt === null,
        },
      });
    }

    const lastSupport = supportThread?.messages[0];
    if (supportThread && lastSupport) {
      const supportName = tEmployer("messagesCard.supportSender");
      rawMsgList.push({
        sortAt: lastSupport.createdAt.getTime(),
        row: {
          id: `support-${supportThread.id}`,
          href: "/support",
          senderName: supportName,
          initials: "CN",
          subject: tEmployer("messagesCard.supportSubject"),
          snippet:
            lastSupport.text.replace(/^\[IMG:[^\]]+\]\s*/, "").trim() ||
            tEmployer("messagesCard.attachment"),
          timeLabel: formatMessageTime(
            lastSupport.createdAt,
            now,
            todayLabel,
            yesterdayLabel,
          ),
          unread:
            lastSupport.senderId !== sessionUser.id &&
            lastSupport.readAt === null,
        },
      });
    }

    rawMsgList.sort((a, b) => b.sortAt - a.sortAt);
    const recentMessageRows = rawMsgList.slice(0, 3).map((x) => x.row);

    const txDetails =
      latestCompletedSub &&
      typeof latestCompletedSub.transactionDetails === "object" &&
      latestCompletedSub.transactionDetails !== null
        ? (latestCompletedSub.transactionDetails as { planName?: string })
        : null;
    const activePlanName =
      txDetails?.planName?.trim() || tEmployer("subscriptionCard.defaultPlan");

    return (
      <ClientMessages namespaces={["StudentAccount", "EmployerAccount"]}>
        <EmployerAccountDashboard
          accountEmail={employerUser.email}
          initialCompany={{
            id: company.id,
            name: company.name ?? "",
            industry: company.industry ?? "",
            city: company.city ?? "",
            country: company.country ?? "",
            website: company.website ?? "",
            contactEmail: company.contactEmail ?? "",
            contactPerson: company.contactPerson ?? "",
            size: company.size ?? "",
            description: company.description ?? "",
            hasLogo: company.hasLogo,
            logoVersion: company.updatedAt.getTime(),
          }}
          approval={company.approval}
          approvedAtLabel={
            company.approvedAt ? formatDate(company.approvedAt) : null
          }
          initialTwoFactorEnabled={employerUser.twoFactorEnabled}
          stats={{
            unreadMessages,
            newCount,
            inReviewCount,
            interviewCount,
            decisionCount,
          }}
          subscription={{
            active: subActive,
            planName: activePlanName,
            expiresLabel: company.subscriptionUntil
              ? formatDate(company.subscriptionUntil)
              : null,
            pendingPayment: Boolean(pendingSubRow),
          }}
          initialVacancies={vacancyRows}
          totalActiveVacancies={totalActiveVacancies}
          recentApplicants={applicantRows}
          recentMessages={recentMessageRows}
        />
      </ClientMessages>
    );
  }

  // ================= ADMIN CABINET (UNCHANGED) =================
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
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            approval: true,
            subscriptionUntil: true,
            _count: { select: { vacancies: true } },
          },
        },
      },
    }),
    getTranslations("Account"),
    getTranslations("Company"),
  ]);

  if (!account) return redirect({ href: "/login", locale });

  const now = new Date();
  const companySubActive = Boolean(
    account.company?.subscriptionUntil &&
      account.company.subscriptionUntil > now,
  );

  const displayName =
    account.role === "COMPANY"
      ? account.company?.name || account.email
      : account.email;

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
                  {account.emailVerifiedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                      <CheckIcon size={12} />
                      {t("verified")}
                    </span>
                  ) : null}
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
            {account.role === "COMPANY" && account.company ? (
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

              {account.role === "COMPANY" ? (
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
                href={account.role === "ADMIN" ? "/admin/support" : "/chat"}
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
