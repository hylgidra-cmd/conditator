import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import {
  getSupportMessages,
  sendSupportMessage,
} from "@/backend/chat/support-service";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const supportMsgSchema = z.object({
  text: z.string().trim().min(1).max(4000),
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
    const { id: threadId } = await context.params;
    const { text } = await parseJson(request, supportMsgSchema);

    const message = await sendSupportMessage({
      threadId,
      senderId: user.id,
      senderRole: user.role,
      text,
    });

    return NextResponse.json({ ok: true, message });
  },
);
