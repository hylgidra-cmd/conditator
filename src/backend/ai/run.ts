import type { AiTask } from "@prisma/client";
import type { z } from "zod";
import { isMonthlyLimitReached } from "./budget";
import { writeAiLog } from "./log";
import {
  AiProviderError,
  type AiUsage,
  getAiProvider,
  modelFor,
} from "./provider";

/** AI xatolari. API qatlami ularni foydalanuvchiga tushunarli xato kodiga aylantiradi. */
export class AiError extends Error {
  constructor(readonly code: "AI_LIMIT_REACHED" | "AI_UNAVAILABLE") {
    super(code);
  }
}

/** Noto'g'ri (sxemaga mos kelmagan) javobda qo'shimcha urinishlar soni. */
export const AI_EXTRA_ATTEMPTS = 2;

const NO_USAGE: AiUsage = { inputTokens: 0, outputTokens: 0 };

/**
 * Barcha AI chaqiruvlari shu funksiya orqali o'tadi:
 * oylik limit → provayder → zod tekshiruvi (xato bo'lsa 2 martagacha qayta) → har urinish AiLog ga.
 */
export async function runJsonTask<T extends z.ZodType>(params: {
  task: AiTask;
  system: string;
  input: string;
  schema: T;
  maxTokens: number;
  userId?: string;
}): Promise<z.infer<T>> {
  const provider = await getAiProvider();
  const model = modelFor(params.task);

  for (let attempt = 0; attempt <= AI_EXTRA_ATTEMPTS; attempt++) {
    if (await isMonthlyLimitReached()) throw new AiError("AI_LIMIT_REACHED");

    const started = Date.now();
    const log = (ok: boolean, usage: AiUsage, errorCode?: string) =>
      writeAiLog({
        task: params.task,
        provider: provider.name,
        model,
        usage,
        durationMs: Date.now() - started,
        ok,
        errorCode,
        userId: params.userId,
      });

    let response;
    try {
      response = await provider.generateJson({ ...params, model });
    } catch (error) {
      const reason =
        error instanceof AiProviderError ? error.reason : "UNKNOWN";
      const usage = (error as { usage?: AiUsage }).usage ?? NO_USAGE;
      await log(false, usage, reason);
      // Tarmoq/kalit/rad etish xatolarida qayta urinish foyda bermaydi (SDK o'zi 2 marta urinadi).
      throw new AiError("AI_UNAVAILABLE");
    }

    const parsed = params.schema.safeParse(response.json);
    if (parsed.success) {
      await log(true, response.usage);
      return parsed.data;
    }
    await log(
      false,
      response.usage,
      response.json === undefined ? "INVALID_JSON" : "SCHEMA_MISMATCH",
    );
  }
  throw new AiError("AI_UNAVAILABLE");
}
