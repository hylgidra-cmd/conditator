import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/backend/auth/session";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  await deleteSession(
    request.cookies.get(SESSION_COOKIE)?.value ??
      request.cookies.get(LEGACY_SESSION_COOKIE)?.value,
  );
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
});
