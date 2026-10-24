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
  | "RESEND_TOO_SOON"
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

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}
