import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { registerSchema } from "@/lib/auth/schemas";
import { register } from "@/lib/auth/service";
import { parseJson } from "@/lib/http/errors";
import { clientIp } from "@/lib/http/request";
import { route } from "@/lib/http/route";

export const POST = route(async (request) => {
  rateLimit(`register:${clientIp(request)}`, LIMITS.register);
  const input = await parseJson(request, registerSchema);
  await register(input);
  // Kod faqat emailga ketadi: javobda hech qanday kod yo'q.
  return NextResponse.json({ ok: true }, { status: 201 });
});
