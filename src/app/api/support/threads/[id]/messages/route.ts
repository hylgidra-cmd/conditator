import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import {
  getSupportMessages,
  sendSupportMessage,
} from "@/backend/chat/support-service";
import { errorResponse } from "@/backend/http/errors";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id: threadId } = await context.params;
    const messages = await getSupportMessages(threadId, user.id, user.role);
    return NextResponse.json({ messages });
  } catch (err) {
    return errorResponse(err, req);
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { id: threadId } = await context.params;
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";

    const message = await sendSupportMessage({
      threadId,
      senderId: user.id,
      senderRole: user.role,
      text,
    });

    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return errorResponse(err, req);
  }
}
