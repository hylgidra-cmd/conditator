import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { listSupportThreadsForUser } from "@/backend/chat/support-service";
import { errorResponse } from "@/backend/http/errors";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const threads = await listSupportThreadsForUser(user.id, user.role);
    return NextResponse.json({ threads });
  } catch (err) {
    return errorResponse(err, req);
  }
}
