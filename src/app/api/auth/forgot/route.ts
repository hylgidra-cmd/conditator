import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { emailOnlySchema } from "@/lib/auth/schemas";
import { requestPasswordReset } from "@/lib/auth/service";
import { parseJson } from "@/lib/http/errors";
import { clientIp } from "@/lib/http/request";
import { route } from "@/lib/http/route";

export const POST = route(async (request) => {
  const { email } = await parseJson(request, emailOnlySchema);
  rateLimit(`send:${clientIp(request)}:${email}`, LIMITS.sendCode);
  await requestPasswordReset(email);
  // Email bazada bormi-yo'qmi, javob bir xil.
  return NextResponse.json({ ok: true });
});
