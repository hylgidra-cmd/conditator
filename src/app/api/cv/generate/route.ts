import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCv } from "@/backend/ai/cv";
import { AiError } from "@/backend/ai/run";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { CV_TEXT_MAX } from "@/backend/cv/schema";
import { requireRole } from "@/backend/auth/session";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const bodySchema = z.object({
  text: z
    .string({ error: "TEXT_REQUIRED" })
    .trim()
    .min(1, { error: "TEXT_REQUIRED" })
    // Belgilar soni Unicode bo'yicha (emoji va h.k. bitta belgi).
    .refine((text) => Array.from(text).length <= CV_TEXT_MAX, {
      error: "TEXT_TOO_LONG",
    }),
  language: z.enum(["kk", "uz", "ru", "en"], { error: "LANGUAGE_REQUIRED" }),
  fullName: z.string().trim().max(100, { error: "FIELD_TOO_LONG" }).optional(),
  phone: z.string().trim().max(30, { error: "FIELD_TOO_LONG" }).optional(),
});

/**
 * Talaba matnidan CV qoralamasi. Natija bazaga yozilmaydi: talaba "saqlash" bosmaguncha
 * (PUT /api/cv/me) hech kimga, jumladan kompaniyalarga, ko'rinmaydi.
 */
export const POST = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  rateLimit(`cv-generate:${user.id}`, LIMITS.cvGenerate);
  const input = await parseJson(request, bodySchema);

  try {
    const result = await generateCv({
      ...input,
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiError) throw new ApiError(503, error.code);
    throw error;
  }
});
