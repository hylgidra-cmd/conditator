import type { AdminAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Har bir admin harakati shu yerga yoziladi (kim, nima, kimga, qachon). */
export function writeAdminLog(entry: {
  adminId: string;
  action: AdminAction;
  targetType: "User" | "Company" | "Setting";
  targetId: string;
  details?: Prisma.InputJsonObject;
}) {
  return db.adminLog.create({
    data: { ...entry, details: entry.details ?? {} },
  });
}

export async function recentAdminLogs(take = 20) {
  const rows = await db.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { admin: { select: { email: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    details: row.details as Record<string, unknown>,
    admin: row.admin?.email ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
