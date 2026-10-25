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
  | "EMAIL_NOT_VERIFIED"
  | "ALREADY_VERIFIED"
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
  | "PAYLOAD_TOO_LARGE"
  | "CANNOT_BLOCK_ADMIN"
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

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, ...(error.fields ? { fields: error.fields } : {}) },
      { status: error.status },
    );
  }
  // Ichki xato tafsiloti foydalanuvchiga ko'rsatilmaydi. Logga faqat xato turi va xabari yoziladi.
  console.error(
    "API xatosi:",
    error instanceof Error ? error.message : "noma'lum",
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

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  // Juda katta so'rov tanasi o'qilmaydi (xotira va CPU ni himoyalash).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE");
  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > MAX_JSON_BYTES)
      throw new ApiError(413, "PAYLOAD_TOO_LARGE");
    body = JSON.parse(text);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "VALIDATION");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}
