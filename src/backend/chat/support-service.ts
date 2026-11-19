import { isValidImageDataUrl } from "@/backend/company/logo";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { Role } from "@prisma/client";

const RECEIPT_TAG_GLOBAL_RE = /\[PAYMENT_RECEIPT:[^\]]*\]/gi;
const RECEIPT_ID_RE = /\[PAYMENT_RECEIPT:([a-zA-Z0-9_-]+)\]/;
const SUPPORT_IMAGE_TAG_GLOBAL_RE = /\[SUPPORT_IMAGE:[^\]]*\]/gi;
const SUPPORT_IMAGE_DATA_RE =
  /\[SUPPORT_IMAGE:(data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+)\]/;

export function extractSupportImageDataUrl(text: string): string | null {
  return SUPPORT_IMAGE_DATA_RE.exec(text)?.[1] ?? null;
}

function summarizeSupportText(text: string): string {
  const hasReceipt = RECEIPT_ID_RE.test(text);
  const hasImage = SUPPORT_IMAGE_DATA_RE.test(text);
  const cleaned = text
    .replace(RECEIPT_TAG_GLOBAL_RE, "")
    .replace(SUPPORT_IMAGE_TAG_GLOBAL_RE, "")
    .trim();
  if (cleaned) return cleaned;
  if (hasReceipt) return "💳 To'lov cheki yuborildi";
  if (hasImage) return "📷 Rasm yuborildi";
  return "";
}

function stripSupportImageTag(text: string): string {
  return text.replace(SUPPORT_IMAGE_TAG_GLOBAL_RE, "").trim();
}

export async function ensureSupportThread(userId: string) {
  const thread = await db.supportThread.upsert({
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
  return {
    ...thread,
    messages: thread.messages.map((m) => ({
      ...m,
      text: summarizeSupportText(m.text),
    })),
  };
}

export async function listSupportThreadsForUser(userId: string, role: Role) {
  if (role === Role.ADMIN) {
    const threads = await db.supportThread.findMany({
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
    return threads.map((t) => ({
      ...t,
      messages: t.messages.map((m) => ({
        ...m,
        text: summarizeSupportText(m.text),
      })),
    }));
  }

  const thread = await ensureSupportThread(userId);
  return [thread];
}

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
    const hasImage = SUPPORT_IMAGE_DATA_RE.test(m.text);
    return {
      ...m,
      text: hasImage ? stripSupportImageTag(m.text) : m.text,
      imageUrl: hasImage ? `/api/support/messages/${m.id}/image` : null,
      receiptPaymentStatus: rid ? (paymentStatusMap.get(rid) ?? null) : null,
    };
  });
}

export async function sendSupportMessage(params: {
  threadId: string;
  senderId: string;
  senderRole: Role;
  text?: string;
  imageDataUrl?: string;
  allowSystemTags?: boolean;
}) {
  const rawInput = params.text ?? "";
  const sanitized = params.allowSystemTags
    ? rawInput
    : rawInput
        .replace(RECEIPT_TAG_GLOBAL_RE, "")
        .replace(SUPPORT_IMAGE_TAG_GLOBAL_RE, "");
  const cleanText = sanitized.trim();

  let validatedImage: string | null = null;
  if (params.imageDataUrl) {
    if (
      params.imageDataUrl.length > 2_500_000 ||
      !isValidImageDataUrl(params.imageDataUrl)
    ) {
      throw new ApiError(400, "FILE_TYPE_NOT_ALLOWED");
    }
    validatedImage = params.imageDataUrl;
  }

  if (!cleanText && !validatedImage) {
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

  const storedText = validatedImage
    ? [cleanText, `[SUPPORT_IMAGE:${validatedImage}]`].filter(Boolean).join("\n")
    : cleanText;

  const message = await db.supportMessage.create({
    data: {
      threadId: params.threadId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      text: storedText,
    },
  });

  await db.supportThread.update({
    where: { id: params.threadId },
    data: { updatedAt: new Date() },
  });

  return {
    ...message,
    text: validatedImage ? cleanText : message.text,
    imageUrl: validatedImage ? `/api/support/messages/${message.id}/image` : null,
    receiptPaymentStatus: null,
  };
}
