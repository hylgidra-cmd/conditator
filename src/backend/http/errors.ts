import { NextResponse } from "next/server";
import { z } from "zod";

// API xato kodlari. Foydalanuvchiga ko'rsatiladigan matn messages/*.json dagi "Errors" bo'limida.
export type ErrorCode =
  | "VALIDATION"
  | "BAD_ORIGIN"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_BLOCKED"
  | "CODE_INVALID"
  | "CODE_EXPIRED"
  | "CODE_LOCKED"
  | "CODE_DAILY_LIMIT"
  | "RESEND_TOO_SOON"
  | "CV_NOT_SAVED"
  | "NOT_FOUND"
  | "COMPANY_NOT_APPROVED"
  | "FILE_TOO_LARGE"
  | "FILE_TYPE_NOT_ALLOWED"
  | "AI_LIMIT_REACHED"
  | "AI_UNAVAILABLE"
  | "EMAIL_UNAVAILABLE"
  | "PAYLOAD_TOO_LARGE"
  | "CANNOT_BLOCK_ADMIN"
  | "CONVERSATION_NOT_FOUND"
  | "ONE_MESSAGE_RULE_AWAIT_REPLY"
  | "PAYMENT_NOT_FOUND"
  | "VACANCY_NOT_FOUND"
  | "VACANCY_INACTIVE_OR_EXPIRED"
  | "INVALID_OR_UNSAVED_CV"
  | "ALREADY_APPLIED"
  | "APPLY_PASS_REQUIRED"
  | "SERVER_ERROR";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly fields?: Record<string, string>,
  ) {
    super(code);
  }
}

export function errorResponse(error: unknown, request?: Request): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, ...(error.fields ? { fields: error.fields } : {}) },
      { status: error.status },
    );
  }
  // Ichki xato tafsiloti foydalanuvchiga ko'rsatilmaydi. Logga bitta JSON qator (instrumentation.ts
  // bilan bir xil): metod, yo'l (query siz) va xabar. So'rov tanasi yozilmaydi.
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      method: request?.method,
      path: request ? new URL(request.url).pathname : undefined,
      type: "api",
      message: error instanceof Error ? error.message : "noma'lum",
    }),
  );
  return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
}

/** zod xatolarini { maydon: XATO_KODI } ko'rinishiga keltiradi. Sxemadagi xabarlar xato kodlari. */
export function validationError(error: z.ZodError): ApiError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return new ApiError(400, "VALIDATION", fields);
}

/** JSON so'rov tanasining eng katta hajmi. Eng kattasi CV (~50 KB gacha). */
export const MAX_JSON_BYTES = 100_000;

/**
 * So'rov tanasini chegaragacha o'qiydi. Content-Length ko'rsatilmagan (chunked) katta tana ham
 * xotiraga to'liq yuklanmaydi: chegaradan oshgan zahoti o'qish to'xtaydi.
 */
export async function readBodyLimited(
  request: Request,
  maxBytes: number,
  code: ErrorCode = "PAYLOAD_TOO_LARGE",
): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new ApiError(413, code);
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new ApiError(413, code);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  // Juda katta so'rov tanasi o'qilmaydi (xotira va CPU ni himoyalash).
  const raw = await readBodyLimited(request, MAX_JSON_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new ApiError(400, "VALIDATION");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}
