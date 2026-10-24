import type { AiJsonRequest, AiProvider, AiRawResponse } from "./provider";

/** Testlar uchun soxta provayder: oldindan berilgan javoblarni navbat bilan qaytaradi. */
export class FakeAiProvider implements AiProvider {
  readonly name = "fake";
  readonly requests: AiJsonRequest[] = [];

  constructor(private readonly responses: unknown[]) {}

  async generateJson(request: AiJsonRequest): Promise<AiRawResponse> {
    this.requests.push(request);
    const next =
      this.responses.length > 1 ? this.responses.shift() : this.responses[0];
    if (next instanceof Error) throw next;
    return { json: next, usage: { inputTokens: 1000, outputTokens: 500 } };
  }
}
