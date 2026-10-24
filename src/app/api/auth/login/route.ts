import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/schemas";
import { login } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { parseJson } from "@/lib/http/errors";
import { clientIp } from "@/lib/http/request";
import { route } from "@/lib/http/route";

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
