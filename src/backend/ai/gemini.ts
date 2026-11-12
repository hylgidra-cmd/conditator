import type { AiJsonRequest, AiProvider, AiRawResponse } from "./provider";
import { AiProviderError } from "./provider";

/**
 * Google Gemini API provayderi (gemini-2.0-flash yoki gemini-1.5-flash).
 * https://aistudio.google.com orqali mutlaqo bepul API kalit olinadi.
 * Native fetch ishlatiladi, hech qanday qo'shimcha og'ir paket talab qilmaydi.
 */
export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly defaultModel: string = "gemini-2.5-flash",
  ) {}

  async generateJson(request: AiJsonRequest): Promise<AiRawResponse> {
    if (!this.apiKey) {
      throw new AiProviderError("AUTH");
    }

    const model =
      request.model.startsWith("gemini") && request.model !== "gemini-2.0-flash"
        ? request.model
        : this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const promptText = `${request.system}\n\nJSON Schema/Instruction:\nReturn ONLY a valid JSON object matching the requested schema.\n\nInput Data:\n${request.input}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: request.maxTokens,
            temperature: 0.2,
          },
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
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        parsedJson = undefined;
      }

      return {
        json: parsedJson,
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      throw new AiProviderError("NETWORK");
    }
  }
}
