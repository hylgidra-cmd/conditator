import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import {
  type AiJsonRequest,
  type AiProvider,
  AiProviderError,
  type AiRawResponse,
} from "./provider";

/** Anthropic Claude adapteri. Kalit faqat serverda (.env: ANTHROPIC_API_KEY). */
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(apiKey: string | undefined) {
    // Kalit bo'lmasa ham obyekt yaratiladi; birinchi chaqiruvda AUTH xatosi qaytadi.
    this.client = new Anthropic({
      apiKey: apiKey || "missing",
      maxRetries: 2,
      timeout: 60_000,
    });
  }

  async generateJson(request: AiJsonRequest): Promise<AiRawResponse> {
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        system: request.system,
        messages: [{ role: "user", content: request.input }],
        // Oddiy ajratib olish vazifasi: chuqur fikrlash shart emas, narx past bo'ladi.
        output_config: {
          effort: "low",
          format: zodOutputFormat(request.schema as z.ZodType<unknown>),
        },
      });
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError)
        throw new AiProviderError("AUTH");
      if (error instanceof Anthropic.RateLimitError)
        throw new AiProviderError("RATE_LIMIT");
      if (error instanceof Anthropic.APIError) {
        throw new AiProviderError(`HTTP_${error.status ?? "NETWORK"}`);
      }
      throw new AiProviderError("UNKNOWN");
    }

    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
    if (response.stop_reason === "refusal") {
      // Rad etilgan so'rov ham pullik: tokenlar logga yozilishi uchun xato ichida qaytariladi.
      throw Object.assign(new AiProviderError("REFUSAL"), { usage });
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined; // run.ts buni noto'g'ri javob deb hisoblab, qayta urinadi
    }
    return { json, usage };
  }
}
