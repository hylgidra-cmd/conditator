import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { verifySchema } from "@/lib/auth/schemas";
import { verifyEmail } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import { parseJson } from "@/lib/http/errors";
import { clientIp } from "@/lib/http/request";
import { route } from "@/lib/http/route";

export const POST = route(async (request) => {
  rateLimit(`verify:${clientIp(request)}`, LIMITS.verify);
  const input = await parseJson(request, verifySchema);
  const user = await verifyEmail(input);
  const response = NextResponse.json({ ok: true, role: user.role });
  await createSession(response, user.id);
  return response;
});
