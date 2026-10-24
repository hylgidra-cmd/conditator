import type { AiTask } from "@prisma/client";
import type { z } from "zod";
import { aiEnv } from "@/lib/env";

/** Provayderga yuboriladigan so'rov. Javob JSON bo'lishi shart; tekshiruv run.ts da. */
export type AiJsonRequest = {
  task: AiTask;
  model: string;
  /** Doimiy ko'rsatmalar (system prompt). */
  system: string;
  /** Foydalanuvchi ma'lumoti. Shaxsiy ma'lumotlar oldindan tozalangan bo'lishi kerak (pii.ts). */
  input: string;
  /** Javob tuzilmasi. Provayder uni JSON schema sifatida modelga beradi. */
  schema: z.ZodType;
  maxTokens: number;
};

export type AiUsage = { inputTokens: number; outputTokens: number };

export type AiRawResponse = {
  /** JSON.parse qilingan javob. JSON bo'lmasa undefined. */
  json: unknown;
  usage: AiUsage;
};

/** LLM provayderi. Yangi provayder = shu interfeysni bajaradigan bitta adapter fayli + .env. */
export interface AiProvider {
  readonly name: string;
  generateJson(request: AiJsonRequest): Promise<AiRawResponse>;
}

/** Provayderdan kelgan, qayta urinib bo'lmaydigan xato (tarmoq, kalit, rad etish). */
export class AiProviderError extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

let override: AiProvider | undefined;
let cached: AiProvider | undefined;

export async function getAiProvider(): Promise<AiProvider> {
  if (override) return override;
  if (cached) return cached;
  const env = aiEnv();
  switch (env.AI_PROVIDER) {
    case "anthropic": {
      const { AnthropicProvider } = await import("./anthropic");
      cached = new AnthropicProvider(env.ANTHROPIC_API_KEY);
      return cached;
    }
  }
}

/** Faqat testlar uchun: provayderni almashtirish (undefined — asl holatga qaytarish). */
export function setAiProviderForTests(provider: AiProvider | undefined): void {
  override = provider;
}

export function modelFor(task: AiTask): string {
  const env = aiEnv();
  return task === "CV_GEN" ? env.AI_MODEL_CV : env.AI_MODEL_MATCH;
}
