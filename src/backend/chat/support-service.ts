import { Prisma, Role } from "@prisma/client";
import { isValidImageDataUrl } from "@/backend/company/logo";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";

const RECEIPT_TAG_GLOBAL_RE = /\[PAYMENT_RECEIPT:[^\]]*\]/gi;
const RECEIPT_ID_RE = /\[PAYMENT_RECEIPT:([a-zA-Z0-9_-]+)\]/;
const SUPPORT_IMAGE_TAG_GLOBAL_RE = /\[SUPPORT_IMAGE:[^\]]*\]/gi;
const SUPPORT_IMAGE_DATA_RE =
  /\[SUPPORT_IMAGE:(data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+)\]/;

/** Siqilgan mobil skrinshot/rasmlar uchun maksimal Base64 uzunligi (~900 KB fayl). */
export const MAX_SUPPORT_IMAGE_DATA_URL_LEN = 1_250_000;
const MAX_SUPPORT_THREADS = 100;
const MAX_SUPPORT_MESSAGES = 120;

export function extractSupportImageDataUrl(text: string): string | null {
  return SUPPORT_IMAGE_DATA_RE.exec(text)?.[1] ?? null;
}

function summarizeCleanSupportText(cleanText: string, hasImage: boolean): string {
  const hasReceipt = RECEIPT_ID_RE.test(cleanText);
  const cleaned = cleanText.replace(RECEIPT_TAG_GLOBAL_RE, "").trim();
  if (cleaned) return cleaned;
  if (hasReceipt) return "💳 To'lov cheki yuborildi";
  if (hasImage) return "📷 Rasm yuborildi";
  return "";
}

type LatestSupportMsgRow = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: Role;
  cleanText: string;
  hasImage: boolean;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * Har bir support thread uchun faqat oxirgi 1 ta xabarni PostgreSQL ichida
 * [SUPPORT_IMAGE:...] Base64 qismini olib tashlagan holda oladi (TOAST rasm tarmoqqa chiqmaydi).
 */
async function loadLatestSupportMessages(
  threadIds: string[],
): Promise<Map<string, LatestSupportMsgRow>> {
  const map = new Map<string, LatestSupportMsgRow>();
  if (threadIds.length === 0) return map;

  const rows = await db.$queryRaw<LatestSupportMsgRow[]>(Prisma.sql`
    SELECT DISTINCT ON ("threadId")
      id,
      "threadId",
      "senderId",
      "senderRole",
      btrim(regexp_replace(text, '\\[SUPPORT_IMAGE:[^\\]]*\\]', '', 'gi')) AS "cleanText",
      (position('[SUPPORT_IMAGE:data:image/' in text) > 0) AS "hasImage",
      "readAt",
      "createdAt"
    FROM "SupportMessage"
    WHERE "threadId" IN (${Prisma.join(threadIds)})
    ORDER BY "threadId", "createdAt" DESC
  `);

  for (const row of rows) {
    map.set(row.threadId, row);
  }
  return map;
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
    },
  });

  const latestMap = await loadLatestSupportMessages([thread.id]);
  const latest = latestMap.get(thread.id);

  return {
    ...thread,
    messages: latest
      ? [
          {
            id: latest.id,
            threadId: latest.threadId,
            senderId: latest.senderId,
            senderRole: latest.senderRole,
            text: summarizeCleanSupportText(latest.cleanText, latest.hasImage),
            readAt: latest.readAt,
            createdAt: latest.createdAt,
          },
        ]
      : [],
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
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_SUPPORT_THREADS,
    });

    const latestMap = await loadLatestSupportMessages(threads.map((t) => t.id));

    return threads.map((t) => {
      const latest = latestMap.get(t.id);
      return {
        ...t,
        messages: latest
          ? [
              {
                id: latest.id,
                threadId: latest.threadId,
                senderId: latest.senderId,
                senderRole: latest.senderRole,
                text: summarizeCleanSupportText(
                  latest.cleanText,
                  latest.hasImage,
                ),
                readAt: latest.readAt,
                createdAt: latest.createdAt,
              },
            ]
          : [],
      };
    });
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

  // Oxirgi 120 ta xabarni PostgreSQL ichida Base64 rasmsiz olamiz (har pollingda megabaytlar o'qilmaydi).
  const rawDesc = await db.$queryRaw<LatestSupportMsgRow[]>(Prisma.sql`
    SELECT
      id,
      "threadId",
      "senderId",
      "senderRole",
      btrim(regexp_replace(text, '\\[SUPPORT_IMAGE:[^\\]]*\\]', '', 'gi')) AS "cleanText",
      (position('[SUPPORT_IMAGE:data:image/' in text) > 0) AS "hasImage",
      "readAt",
      "createdAt"
    FROM "SupportMessage"
    WHERE "threadId" = ${threadId}
    ORDER BY "createdAt" DESC
    LIMIT ${MAX_SUPPORT_MESSAGES}
  `);
  const messages = rawDesc.reverse();

  // Faqat haqiqatan o'qilmagan xabar bor bo'lsagina UPDATE yuboramiz (99% ortiqcha DB yozuvni yo'qotadi).
  const hasUnread = messages.some((m) => m.senderId !== userId && !m.readAt);
  if (hasUnread) {
    await db.supportMessage.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  const receiptIds = Array.from(
    new Set(
      messages
        .map((m) => RECEIPT_ID_RE.exec(m.cleanText)?.[1])
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
    const rid = RECEIPT_ID_RE.exec(m.cleanText)?.[1];
    return {
      id: m.id,
      threadId: m.threadId,
      senderId: m.senderId,
      senderRole: m.senderRole,
      text: m.cleanText,
      readAt: m.readAt,
      createdAt: m.createdAt,
      imageUrl: m.hasImage ? `/api/support/messages/${m.id}/image` : null,
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
      params.imageDataUrl.length > MAX_SUPPORT_IMAGE_DATA_URL_LEN ||
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
