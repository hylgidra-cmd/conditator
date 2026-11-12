import { type Prisma, type UserStatus } from "@prisma/client";
import {
  AI_LIMIT_SETTING,
  monthlyLimitUsd,
  monthStart,
  spentThisMonthUsd,
} from "@/backend/ai/budget";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { writeAdminLog } from "./log";
import {
  ADMIN_PAGE_SIZE,
  type CompanyListQuery,
  type UserListQuery,
} from "./schema";

function paged<T>(items: T[], total: number, page: number) {
  return {
    items,
    total,
    page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

/** Foydalanuvchilar: qidiruv (email yoki kompaniya nomi), rol va holat filtri, server tomonda sahifalash. */
export async function listUsers(query: UserListQuery) {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { email: { contains: query.q, mode: "insensitive" } },
            { company: { name: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await db.$transaction([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        company: { select: { name: true, approval: true } },
        cvs: {
          select: { savedAt: true, isVisible: true },
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
  ]);
  const items = rows.map((row) => {
    const primaryCv = row.cvs[0];
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      verified: row.emailVerifiedAt !== null,
      createdAt: row.createdAt.toISOString(),
      companyName: row.company?.name ?? null,
      companyApproval: row.company?.approval ?? null,
      cvSaved: Boolean(primaryCv?.savedAt),
      cvVisible: Boolean(primaryCv?.savedAt && primaryCv.isVisible),
    };
  });
  return paged(items, total, query.page);
}

/** Bloklash: barcha sessiyalari o'chiriladi (darhol chiqariladi). Adminni bloklab bo'lmaydi. */
export async function setUserStatus(
  adminId: string,
  userId: string,
  status: UserStatus,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true },
  });
  if (!user) throw new ApiError(404, "NOT_FOUND");
  if (user.role === "ADMIN") throw new ApiError(409, "CANNOT_BLOCK_ADMIN");
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    ...(status === "BLOCKED"
      ? [db.session.deleteMany({ where: { userId } })]
      : []),
  ]);
  await writeAdminLog({
    adminId,
    action: status === "BLOCKED" ? "USER_BLOCK" : "USER_UNBLOCK",
    targetType: "User",
    targetId: userId,
    details: { email: user.email, from: user.status, to: status },
  });
  return { id: user.id, status };
}

export async function listCompanies(query: CompanyListQuery) {
  const where: Prisma.CompanyWhereInput = {
    ...(query.approval ? { approval: query.approval } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { user: { email: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await db.$transaction([
    db.company.count({ where }),
    db.company.findMany({
      where,
      // Tasdiq kutayotganlar birinchi.
      orderBy: [{ approval: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        user: { select: { email: true, status: true } },
        _count: { select: { vacancies: true } },
      },
    }),
  ]);
  const items = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.user.email,
    userStatus: row.user.status,
    country: row.country,
    industry: row.industry,
    size: row.size,
    contactPerson: row.contactPerson,
    approval: row.approval,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    subscriptionUntil: row.subscriptionUntil?.toISOString() ?? null,
    vacancies: row._count.vacancies,
    createdAt: row.createdAt.toISOString(),
  }));
  return paged(items, total, query.page);
}

async function findCompany(id: string) {
  const company = await db.company.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!company) throw new ApiError(404, "NOT_FOUND");
  return company;
}

export async function setCompanyApproval(
  adminId: string,
  companyId: string,
  approved: boolean,
) {
  const before = await findCompany(companyId);
  const company = await db.company.update({
    where: { id: companyId },
    data: approved
      ? { approval: "APPROVED", approvedAt: new Date() }
      : { approval: "REJECTED", approvedAt: null },
    select: { id: true, approval: true, approvedAt: true },
  });
  await writeAdminLog({
    adminId,
    action: approved ? "COMPANY_APPROVE" : "COMPANY_REJECT",
    targetType: "Company",
    targetId: companyId,
    details: {
      name: before.name,
      email: before.user.email,
      from: before.approval,
      to: company.approval,
    },
  });
  return company;
}

/** "YYYY-MM-DD" → shu kun oxiri, Toshkent vaqti (UTC+5). */
export function endOfDayTashkent(date: string): Date {
  return new Date(`${date}T23:59:59.999+05:00`);
}

export async function setSubscription(
  adminId: string,
  companyId: string,
  until: string | null,
) {
  const before = await findCompany(companyId);
  const value = until ? endOfDayTashkent(until) : null;
  const company = await db.company.update({
    where: { id: companyId },
    data: { subscriptionUntil: value },
    select: { id: true, subscriptionUntil: true },
  });
  await writeAdminLog({
    adminId,
    action: value ? "SUBSCRIPTION_SET" : "SUBSCRIPTION_OFF",
    targetType: "Company",
    targetId: companyId,
    details: {
      name: before.name,
      email: before.user.email,
      from: before.subscriptionUntil?.toISOString() ?? null,
      to: value?.toISOString() ?? null,
    },
  });
  return {
    id: company.id,
    subscriptionUntil: company.subscriptionUntil?.toISOString() ?? null,
  };
}

/** AI: shu oydagi so'rovlar (har urinish) va xarajat, vazifa bo'yicha. */
export async function aiStats() {
  const since = monthStart();
  const [spent, limit, byTask] = await Promise.all([
    spentThisMonthUsd(),
    monthlyLimitUsd(),
    db.aiLog.groupBy({
      by: ["task", "ok"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
  ]);
  const tasks = {
    CV_GEN: { ok: 0, failed: 0, costUsd: 0 },
    MATCH: { ok: 0, failed: 0, costUsd: 0 },
  };
  for (const row of byTask) {
    const entry = tasks[row.task];
    if (row.ok) entry.ok += row._count._all;
    else entry.failed += row._count._all;
    entry.costUsd += row._sum.costUsd?.toNumber() ?? 0;
  }
  const requests = Object.values(tasks).reduce(
    (sum, task) => sum + task.ok + task.failed,
    0,
  );
  return {
    monthStart: since.toISOString(),
    requests,
    spentUsd: Math.round(spent * 1e6) / 1e6,
    limitUsd: limit,
    limitReached: spent >= limit,
    tasks,
  };
}

export async function setAiLimit(adminId: string, limitUsd: number) {
  const before = await monthlyLimitUsd();
  await db.setting.upsert({
    where: { key: AI_LIMIT_SETTING },
    create: { key: AI_LIMIT_SETTING, value: String(limitUsd) },
    update: { value: String(limitUsd) },
  });
  await writeAdminLog({
    adminId,
    action: "AI_LIMIT_SET",
    targetType: "Setting",
    targetId: AI_LIMIT_SETTING,
    details: { from: before, to: limitUsd },
  });
}

/** Umumiy statistika. */
export async function platformStats() {
  const [
    students,
    cvsSaved,
    cvsVisible,
    companies,
    companiesApproved,
    companiesPending,
    vacancies,
  ] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.cv.count({ where: { savedAt: { not: null } } }),
    db.cv.count({ where: { savedAt: { not: null }, isVisible: true } }),
    db.company.count(),
    db.company.count({ where: { approval: "APPROVED" } }),
    db.company.count({ where: { approval: "PENDING" } }),
    db.vacancy.count(),
  ]);
  return {
    students,
    cvsSaved,
    cvsVisible,
    companies,
    companiesApproved,
    companiesPending,
    vacancies,
  };
}
