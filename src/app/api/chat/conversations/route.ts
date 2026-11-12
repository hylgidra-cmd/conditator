import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { listUserConversations } from "@/backend/chat/service";
import { errorResponse } from "@/backend/http/errors";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const conversations = await listUserConversations(user.id, user.role);
    return NextResponse.json({ conversations });
  } catch (err) {
    return errorResponse(err, req);
  }
}
