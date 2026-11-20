import { ComplaintStatus, ConversationStatus, Prisma, Role } from "@prisma/client";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { isCompanySubscribedOrUnlocked } from "@/backend/payment/service";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CONVERSATIONS = 60;
const MAX_CHAT_MESSAGES = 120;

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
    select: {
      id: true,
      studentId: true,
      companyId: true,
      status: true,
    },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND");
  }

  if (conversation.status !== ConversationStatus.ACTIVE) {
    throw new ApiError(403, "FORBIDDEN");
  }

  await assertConversationParticipant(conversation, params.senderId);

  // 1-xabar qoidasi: barcha xabarlarni yuklamasdan tezkor mavjudlik (EXISTS) tekshiruvi.
  if (params.senderRole === Role.STUDENT) {
    const [companyMsg, studentMsg] = await Promise.all([
      db.chatMessage.findFirst({
        where: {
          conversationId: params.conversationId,
          senderRole: Role.COMPANY,
        },
        select: { id: true },
      }),
      db.chatMessage.findFirst({
        where: {
          conversationId: params.conversationId,
          senderRole: Role.STUDENT,
        },
        select: { id: true },
      }),
    ]);
    if (!companyMsg && studentMsg) {
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
    select: { id: true, studentId: true, companyId: true },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND");
  }

  await assertConversationParticipant(conversation, userId);

  const messagesDesc = await db.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_CHAT_MESSAGES,
  });
  const messages = messagesDesc.reverse();

  // Faqat o'qilmagan kiruvchi xabar bo'lsagina UPDATE yuboramiz.
  const hasUnread = messages.some((m) => m.senderId !== userId && !m.readAt);
  if (hasUnread) {
    await db.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  return messages;
}

export async function listUserConversations(userId: string, role: Role) {
  if (role === Role.STUDENT) {
    const rows = await db.conversation.findMany({
      where: { studentId: userId },
      include: {
        company: {
          select: { id: true, userId: true, name: true, hasLogo: true },
        },
        vacancy: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_CONVERSATIONS,
    });
    return rows.map((r) => ({ ...r, studentName: null as string | null }));
  }

  const company = await db.company.findFirst({
    where: {
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  if (!company) return [];

  const [rows, hasActiveSubscription] = await Promise.all([
    db.conversation.findMany({
      where: { companyId: company.id },
      include: {
        company: {
          select: { id: true, userId: true, name: true, hasLogo: true },
        },
        vacancy: { select: { id: true, title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_CONVERSATIONS,
    }),
    isCompanySubscribedOrUnlocked(company.id),
  ]);

  const cvIds = Array.from(
    new Set(
      rows
        .map((r) => r.studentCvId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  // To'liq Cv.data (ichida Base64 rasm bor!) o'rniga faqat fullName va hideName ni olamiz.
  const cvs =
    cvIds.length > 0
      ? await db.$queryRaw<
          Array<{
            id: string;
            title: string;
            fullName: string | null;
            hideName: boolean;
          }>
        >(Prisma.sql`
          SELECT
            id,
            title,
            data->>'fullName' AS "fullName",
            COALESCE((privacy->>'hideName')::boolean, false) AS "hideName"
          FROM "Cv"
          WHERE id IN (${Prisma.join(cvIds)})
        `)
      : [];

  const cvNameMap = new Map(
    cvs.map((c) => {
      if (!hasActiveSubscription) {
        return [
          c.id,
          c.title ? `${c.title} (qulflangan)` : "Nomzod (qulflangan)",
        ];
      }
      const name = c.hideName
        ? c.title || "Nomzod"
        : c.fullName || c.title || "Nomzod";
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
      conv.studentId === params.reporterId
        ? conv.company.userId
        : conv.studentId;
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
