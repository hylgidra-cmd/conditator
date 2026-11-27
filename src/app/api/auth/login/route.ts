import { NextResponse } from "next/server";
import { LIMITS, rateLimitDistributed } from "@/backend/auth/rate-limit";
import { loginSchema } from "@/backend/auth/schemas";
import { issueLogin2faChallenge, login } from "@/backend/auth/service";
import { createSession } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  const ip = clientIp(request);
  await rateLimitDistributed(`login-ip:${ip}`, LIMITS.loginIp);
  const input = await parseJson(request, loginSchema);
  await rateLimitDistributed(`login:${ip}:${input.email}`, LIMITS.login);
  const user = await login(input);

  if (user.twoFactorEnabled) {
    const challengeToken = await issueLogin2faChallenge(user);
    return NextResponse.json({
      ok: true,
      requiresTwoFactor: true,
      challengeToken,
    });
  }

  const response = NextResponse.json({ ok: true, role: user.role });
  await createSession(response, user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: ip,
  });
  return response;
});
