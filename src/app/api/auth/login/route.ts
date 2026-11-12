import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { loginSchema } from "@/backend/auth/schemas";
import { login } from "@/backend/auth/service";
import { createSession } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  const ip = clientIp(request);
  rateLimit(`login-ip:${ip}`, LIMITS.loginIp);
  const input = await parseJson(request, loginSchema);
  rateLimit(`login:${ip}:${input.email}`, LIMITS.login);
  const user = await login(input);
  const response = NextResponse.json({ ok: true, role: user.role });
  await createSession(response, user.id);
  return response;
});
