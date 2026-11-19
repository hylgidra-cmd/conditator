import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { listSupportThreadsForUser } from "@/backend/chat/support-service";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  const threads = await listSupportThreadsForUser(user.id, user.role);
  return NextResponse.json({ threads });
});
