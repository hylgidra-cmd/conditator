import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { listUserConversations } from "@/backend/chat/service";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  const conversations = await listUserConversations(user.id, user.role);
  return NextResponse.json({ conversations });
});
