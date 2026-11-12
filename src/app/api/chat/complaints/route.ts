import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { createComplaint } from "@/backend/chat/service";
import { errorResponse } from "@/backend/http/errors";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { reportedUserId, conversationId, reason, details } = body;

    const complaint = await createComplaint({
      reporterId: user.id,
      reportedUserId,
      conversationId,
      reason,
      details,
    });

    return NextResponse.json({ ok: true, complaint });
  } catch (err) {
    return errorResponse(err, req);
  }
}
