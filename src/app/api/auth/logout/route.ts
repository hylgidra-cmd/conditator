import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { route } from "@/lib/http/route";

export const POST = route(async (request) => {
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
});
