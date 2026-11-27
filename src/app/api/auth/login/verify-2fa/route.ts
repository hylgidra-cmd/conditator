import { NextResponse } from "next/server";
import { LIMITS, rateLimitDistributed } from "@/backend/auth/rate-limit";
import { twoFactorLoginVerifySchema } from "@/backend/auth/schemas";
import { verifyLogin2fa } from "@/backend/auth/service";
import { createSession } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  const ip = clientIp(request);
  await rateLimitDistributed(`verify-2fa-ip:${ip}`, LIMITS.verify);
  const input = await parseJson(request, twoFactorLoginVerifySchema);
  const user = await verifyLogin2fa(input.challengeToken, input.code);
  const response = NextResponse.json({ ok: true, role: user.role });
  await createSession(response, user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress: ip,
  });
  return response;
});
