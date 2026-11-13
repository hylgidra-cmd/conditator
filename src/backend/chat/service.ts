import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { Role, ComplaintStatus } from "@prisma/client";

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: Role;
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}) {
  const conversation = await db.conversation.findUnique({
    where: { id: params.conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!conversation) {
    throw new ApiError(404, "CONVERSATION_NOT_FOUND");
  }

  // Check 1-message rule for students
  if (params.senderRole === Role.STUDENT) {
    const lastMsg = conversation.messages[0];
    if (lastMsg && lastMsg.senderRole === Role.STUDENT) {
      throw new ApiError(403, "ONE_MESSAGE_RULE_AWAIT_REPLY");
    }
  }

  if (params.fileSize && params.fileSize > MAX_ATTACHMENT_BYTES) {
    throw new ApiError(400, "FILE_TOO_LARGE");
  }

  const message = await db.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      text: params.text.trim(),
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
        company: { select: { id: true, name: true, logoPath: true } },
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

  const rows = await db.conversation.findMany({
    where: { companyId: company.id },
    include: {
      company: { select: { id: true, name: true, logoPath: true } },
      vacancy: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const studentIds = [...new Set(rows.map((r) => r.studentId))];
  const cvIds = rows
    .map((r) => r.studentCvId)
    .filter((id): id is string => Boolean(id));

  const [students, cvs] = await Promise.all([
    studentIds.length > 0
      ? db.user.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, email: true },
        })
      : [],
    cvIds.length > 0
      ? db.cv.findMany({
          where: { id: { in: cvIds } },
          select: { id: true, title: true, data: true },
        })
      : [],
  ]);

  const studentEmailMap = new Map(students.map((s) => [s.id, s.email]));
  const cvNameMap = new Map(
    cvs.map((c) => {
      const data = c.data as { fullName?: string } | null;
      return [c.id, data?.fullName || c.title || null];
    }),
  );

  return rows.map((r) => ({
    ...r,
    studentName:
      (r.studentCvId ? cvNameMap.get(r.studentCvId) : null) ??
      studentEmailMap.get(r.studentId) ??
      null,
  }));
}

export async function createComplaint(params: {
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: string;
  details?: string;
}) {
  return db.complaint.create({
    data: {
      reporterId: params.reporterId,
      reportedUserId: params.reportedUserId,
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
  return db.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedById: adminId,
    },
  });
}
