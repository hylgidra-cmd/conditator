import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import {
  MAX_SUPPORT_IMAGE_DATA_URL_LEN,
  getSupportMessages,
  sendSupportMessage,
} from "@/backend/chat/support-service";
import { isValidImageDataUrl } from "@/backend/company/logo";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const supportMsgSchema = z
  .object({
    text: z.string().trim().max(4000).optional(),
    imageDataUrl: z
      .string()
      .max(MAX_SUPPORT_IMAGE_DATA_URL_LEN)
      .refine((v) => isValidImageDataUrl(v), "FILE_TYPE_NOT_ALLOWED")
      .optional(),
  })
  .refine((v) => Boolean(v.text?.trim() || v.imageDataUrl), {
    message: "FIELD_REQUIRED",
  });

export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request);
    const { id: threadId } = await context.params;
    const messages = await getSupportMessages(threadId, user.id, user.role);
    return NextResponse.json({ messages });
  },
);

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request);
    rateLimit(`support-msg:${user.id}`, { max: 40, windowMs: 60_000 });
    const { id: threadId } = await context.params;
    const { text, imageDataUrl } = await parseJson(
      request,
      supportMsgSchema,
      1_500_000,
    );

    const message = await sendSupportMessage({
      threadId,
      senderId: user.id,
      senderRole: user.role,
      text,
      imageDataUrl,
    });

    return NextResponse.json({ ok: true, message });
  },
);
