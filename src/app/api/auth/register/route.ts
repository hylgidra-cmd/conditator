import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { registerSchema } from "@/backend/auth/schemas";
import { register } from "@/backend/auth/service";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  rateLimit(`register:${clientIp(request)}`, LIMITS.register);
  const input = await parseJson(request, registerSchema);
  await register(input);
  // Kod faqat emailga ketadi: javobda hech qanday kod yo'q.
  return NextResponse.json({ ok: true }, { status: 201 });
});
