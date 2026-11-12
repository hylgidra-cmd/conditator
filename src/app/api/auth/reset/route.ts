import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { resetSchema } from "@/backend/auth/schemas";
import { resetPassword } from "@/backend/auth/service";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  rateLimit(`verify:${clientIp(request)}`, LIMITS.verify);
  const input = await parseJson(request, resetSchema);
  await resetPassword(input);
  return NextResponse.json({ ok: true });
});
