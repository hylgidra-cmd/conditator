import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { Role } from "@prisma/client";

export async function ensureSupportThread(userId: string) {
  return db.supportThread.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          company: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function listSupportThreadsForUser(userId: string, role: Role) {
  if (role === Role.ADMIN) {
    return db.supportThread.findMany({
      where: {
        messages: { some: {} },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            company: { select: { name: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  const thread = await ensureSupportThread(userId);
  return [thread];
}

const RECEIPT_TAG_GLOBAL_RE = /\[PAYMENT_RECEIPT:[^\]]*\]/gi;
const RECEIPT_ID_RE = /\[PAYMENT_RECEIPT:([a-zA-Z0-9_-]+)\]/;

export async function getSupportMessages(
  threadId: string,
  userId: string,
  role: Role,
) {
  const thread = await db.supportThread.findUnique({
    where: { id: threadId },
    select: { id: true, userId: true },
  });

  if (!thread) {
    throw new ApiError(404, "NOT_FOUND");
  }

  if (role !== Role.ADMIN && thread.userId !== userId) {
    throw new ApiError(403, "FORBIDDEN");
  }

  const messages = await db.supportMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  await db.supportMessage.updateMany({
    where: {
      threadId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const receiptIds = Array.from(
    new Set(
      messages
        .map((m) => RECEIPT_ID_RE.exec(m.text)?.[1])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const paymentStatusMap = new Map<string, string>();
  if (receiptIds.length > 0) {
    const payments = await db.payment.findMany({
      where: { id: { in: receiptIds }, userId: thread.userId },
      select: { id: true, status: true },
    });
    for (const p of payments) {
      paymentStatusMap.set(p.id, p.status);
    }
  }

  return messages.map((m) => {
    const rid = RECEIPT_ID_RE.exec(m.text)?.[1];
    return {
      ...m,
      receiptPaymentStatus: rid ? (paymentStatusMap.get(rid) ?? null) : null,
    };
  });
}

export async function sendSupportMessage(params: {
  threadId: string;
  senderId: string;
  senderRole: Role;
  text: string;
  allowSystemTags?: boolean;
}) {
  const rawText = params.allowSystemTags
    ? params.text
    : params.text.replace(RECEIPT_TAG_GLOBAL_RE, "");
  const cleanText = rawText.trim();
  if (!cleanText) {
    throw new ApiError(400, "VALIDATION");
  }

  const thread = await db.supportThread.findUnique({
    where: { id: params.threadId },
    select: { id: true, userId: true },
  });

  if (!thread) {
    throw new ApiError(404, "NOT_FOUND");
  }

  if (params.senderRole !== Role.ADMIN && thread.userId !== params.senderId) {
    throw new ApiError(403, "FORBIDDEN");
  }

  const message = await db.supportMessage.create({
    data: {
      threadId: params.threadId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      text: cleanText,
    },
  });

  await db.supportThread.update({
    where: { id: params.threadId },
    data: { updatedAt: new Date() },
  });

  return message;
}
