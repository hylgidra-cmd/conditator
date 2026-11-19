import { z } from "zod";
import type { AiJsonRequest, AiProvider, AiRawResponse } from "./provider";
import { AiProviderError } from "./provider";

/**
 * Groq Llama 3 provayderi (llama-3.3-70b-versatile).
 */
export class GroqProvider implements AiProvider {
  readonly name = "groq";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly defaultModel: string = "llama-3.3-70b-versatile",
  ) {}

  async generateJson(request: AiJsonRequest): Promise<AiRawResponse> {
    if (!this.apiKey) {
      throw new AiProviderError("AUTH");
    }

    const model = request.model.startsWith("llama")
      ? request.model
      : this.defaultModel;
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const jsonSchema = JSON.stringify(z.toJSONSchema(request.schema));

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `${request.system}\nOutput MUST be a valid JSON object matching this exact JSON Schema:\n${jsonSchema}`,
            },
            { role: "user", content: request.input },
          ],
          response_format: { type: "json_object" },
          max_tokens: request.maxTokens,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new AiProviderError("AUTH");
        }
        if (res.status === 429) {
          throw new AiProviderError("RATE_LIMIT");
        }
        throw new AiProviderError(`HTTP_${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const rawText = data.choices?.[0]?.message?.content ?? "";
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        parsedJson = undefined;
      }

      return {
        json: parsedJson,
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw new AiProviderError("NETWORK");
    }
  }
}
