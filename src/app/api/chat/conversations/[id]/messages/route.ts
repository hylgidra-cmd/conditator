import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { getConversationMessages, sendMessage } from "@/backend/chat/service";
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
    const { id: conversationId } = await context.params;
    const messages = await getConversationMessages(conversationId, user.id);
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
    const { id: conversationId } = await context.params;
    const body = await req.json();
    const { text, fileUrl, fileName, fileSize } = body;

    const message = await sendMessage({
      conversationId,
      senderId: user.id,
      senderRole: user.role,
      text: text || "",
      fileUrl,
      fileName,
      fileSize,
    });

    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return errorResponse(err, req);
  }
}
