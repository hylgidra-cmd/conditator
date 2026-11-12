import { NextResponse } from "next/server";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { emailOnlySchema } from "@/backend/auth/schemas";
import { requestPasswordReset } from "@/backend/auth/service";
import { parseJson } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const POST = route(async (request) => {
  const { email } = await parseJson(request, emailOnlySchema);
  rateLimit(`send:${clientIp(request)}:${email}`, LIMITS.sendCode);
  await requestPasswordReset(email);
  // Email bazada bormi-yo'qmi, javob bir xil.
  return NextResponse.json({ ok: true });
});
