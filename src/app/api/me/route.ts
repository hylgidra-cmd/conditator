import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  return NextResponse.json({ user });
});
