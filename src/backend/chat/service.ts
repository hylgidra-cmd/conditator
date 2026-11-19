import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";
import { ComplaintStatus, ConversationStatus, Role } from "@prisma/client";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

async function assertConversationParticipant(
  conversation: { studentId: string; companyId: string },
  userId: string,
) {
  if (conversation.studentId === userId) return;
  const companyMember = await db.company.findFirst({
    where: {
      id: conversation.companyId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  if (!companyMember) {
    throw new ApiError(403, "FORBIDDEN");
  }
}

function isSafeFileUrl(url: string): boolean {
  if (url.includes("\\") || /[\r\n]/.test(url)) return false;
  if (url.startsWith("https://")) return true;
  return url.startsWith("/") && !url.startsWith("//");
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: Role;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  const cleanText = params.text.trim();
  if (!cleanText && !params.fileUrl) {
    throw new ApiError(400, "VALIDATION");
  }

  const conversation = await db.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      messages: {
        select: { senderRole: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND");
  }

  if (conversation.status !== ConversationStatus.ACTIVE) {
    throw new ApiError(403, "FORBIDDEN");
  }

  await assertConversationParticipant(conversation, params.senderId);

  // 1-xabar qoidasi: faqat kompaniya hali umuman javob bermagan bo'lsa, talaba ketma-ket xabar yubora olmaydi.
  if (params.senderRole === Role.STUDENT) {
    const companyHasReplied = conversation.messages.some(
      (m) => m.senderRole === Role.COMPANY,
    );
    const studentHasSent = conversation.messages.some(
      (m) => m.senderRole === Role.STUDENT,
    );
    if (!companyHasReplied && studentHasSent) {
      throw new ApiError(403, "ONE_MESSAGE_RULE_AWAIT_REPLY");
    }
  }

  if (params.fileUrl && !isSafeFileUrl(params.fileUrl)) {
    throw new ApiError(400, "VALIDATION");
  }

  if (params.fileSize && params.fileSize > MAX_ATTACHMENT_BYTES) {
    throw new ApiError(400, "FILE_TOO_LARGE");
  }

  const message = await db.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      text: cleanText,
      fileUrl: params.fileUrl,
      fileName: params.fileName,
      fileSize: params.fileSize,
    },
  });

  await db.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND");
  }

  await assertConversationParticipant(conversation, userId);

  const messages = await db.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread incoming messages as read
  await db.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return messages;
}

export async function listUserConversations(userId: string, role: Role) {
  if (role === Role.STUDENT) {
    const rows = await db.conversation.findMany({
      where: { studentId: userId },
      include: {
        company: {
          select: { id: true, userId: true, name: true, logoPath: true },
        },
        vacancy: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({ ...r, studentName: null as string | null }));
  }

  const company = await db.company.findFirst({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
    },
  });
  if (!company) return [];

  const [rows, hasActiveSubscription] = await Promise.all([
    db.conversation.findMany({
      where: { companyId: company.id },
      include: {
        company: {
          select: { id: true, userId: true, name: true, logoPath: true },
        },
        vacancy: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    isCompanySubscribedOrUnlocked(company.id),
  ]);

  const cvIds = rows
    .map((r) => r.studentCvId)
    .filter((id): id is string => Boolean(id));

  const cvs =
    cvIds.length > 0
      ? await db.cv.findMany({
          where: { id: { in: cvIds } },
          select: { id: true, title: true, data: true, privacy: true },
        })
      : [];

  const cvNameMap = new Map(
    cvs.map((c) => {
      if (!hasActiveSubscription) {
        return [c.id, c.title ? `${c.title} (qulflangan)` : "Nomzod (qulflangan)"];
      }
      const data = c.data as { fullName?: string } | null;
      const privacy = c.privacy as { hideName?: boolean } | null;
      const name = privacy?.hideName
        ? c.title || "Nomzod"
        : data?.fullName || c.title || "Nomzod";
      return [c.id, name];
    }),
  );

  return rows.map((r) => ({
    ...r,
    studentName:
      (r.studentCvId ? cvNameMap.get(r.studentCvId) : null) ?? "Nomzod",
  }));
}

export async function ensureConversationForCompany(
  userId: string,
  vacancyId: string,
  cvId: string,
): Promise<string | undefined> {
  const company = await db.company.findFirst({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true, approval: true },
  });
  if (!company || company.approval !== "APPROVED") return undefined;

  const [vacancy, cv] = await Promise.all([
    db.vacancy.findFirst({
      where: { id: vacancyId, companyId: company.id },
      select: { id: true },
    }),
    db.cv.findFirst({
      where: {
        id: cvId,
        savedAt: { not: null },
        user: { status: "ACTIVE" },
        OR: [
          { isVisible: true },
          { applications: { some: { vacancyId } } },
        ],
      },
      select: { id: true, userId: true },
    }),
  ]);
  if (!vacancy || !cv) return undefined;

  const hasAccess = await isCompanySubscribedOrUnlocked(company.id, vacancy.id);
  if (!hasAccess) return undefined;

  const conversation = await db.conversation.upsert({
    where: {
      companyId_studentId_vacancyId: {
        companyId: company.id,
        studentId: cv.userId,
        vacancyId: vacancy.id,
      },
    },
    create: {
      companyId: company.id,
      studentId: cv.userId,
      vacancyId: vacancy.id,
      studentCvId: cv.id,
    },
    update: {
      studentCvId: cv.id,
    },
  });

  return conversation.id;
}

export async function createComplaint(params: {
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: string;
  details?: string;
}) {
  let resolvedReportedUserId = params.reportedUserId;
  if (params.conversationId) {
    const conv = await db.conversation.findUnique({
      where: { id: params.conversationId },
      select: {
        studentId: true,
        companyId: true,
        company: { select: { userId: true } },
      },
    });
    if (!conv) {
      throw new ApiError(404, "CONVERSATION_NOT_FOUND");
    }
    await assertConversationParticipant(conv, params.reporterId);
    resolvedReportedUserId =
      conv.studentId === params.reporterId ? conv.company.userId : conv.studentId;
  } else {
    if (resolvedReportedUserId === params.reporterId) {
      throw new ApiError(400, "VALIDATION");
    }
    const target = await db.user.findUnique({
      where: { id: resolvedReportedUserId },
      select: { id: true, role: true },
    });
    if (!target || target.role === Role.ADMIN) {
      throw new ApiError(404, "NOT_FOUND");
    }
  }

  return db.complaint.create({
    data: {
      reporterId: params.reporterId,
      reportedUserId: resolvedReportedUserId,
      conversationId: params.conversationId,
      reason: params.reason,
      details: params.details,
      status: ComplaintStatus.PENDING,
    },
  });
}

export async function resolveComplaint(
  adminId: string,
  complaintId: string,
  status: ComplaintStatus,
) {
  const existing = await db.complaint.findUnique({
    where: { id: complaintId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError(404, "NOT_FOUND");
  }
  return db.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedById: adminId,
    },
  });
}
