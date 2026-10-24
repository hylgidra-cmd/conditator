import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { resetSchema } from "@/lib/auth/schemas";
import { resetPassword } from "@/lib/auth/service";
import { parseJson } from "@/lib/http/errors";
import { clientIp } from "@/lib/http/request";
import { route } from "@/lib/http/route";

export const POST = route(async (request) => {
  rateLimit(`verify:${clientIp(request)}`, LIMITS.verify);
  const input = await parseJson(request, resetSchema);
  await resetPassword(input);
  return NextResponse.json({ ok: true });
});
