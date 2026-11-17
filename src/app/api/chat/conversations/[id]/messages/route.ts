import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { getConversationMessages, sendMessage } from "@/backend/chat/service";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const sendMessageSchema = z.object({
  text: z.string().trim().max(4000).default(""),
  fileUrl: z.string().trim().max(1000).optional(),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export const GET = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request);
    const { id: conversationId } = await context.params;
    const messages = await getConversationMessages(conversationId, user.id);
    return NextResponse.json({ messages });
  },
);

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request);
    const { id: conversationId } = await context.params;
    const body = await parseJson(request, sendMessageSchema);

    const message = await sendMessage({
      conversationId,
      senderId: user.id,
      senderRole: user.role,
      text: body.text,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
    });

    return NextResponse.json({ ok: true, message });
  },
);
