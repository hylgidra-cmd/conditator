import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { route } from "@/lib/http/route";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  return NextResponse.json({ user });
});
