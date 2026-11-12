import type { AiTask } from "@prisma/client";
import { db } from "@/backend/db";
import { costUsd } from "./budget";
import type { AiUsage } from "./provider";

export async function writeAiLog(entry: {
  task: AiTask;
  provider: string;
  model: string;
  usage: AiUsage;
  durationMs: number;
  ok: boolean;
  errorCode?: string;
  userId?: string;
}): Promise<void> {
  await db.aiLog.create({
    data: {
      task: entry.task,
      provider: entry.provider,
      model: entry.model,
      inputTokens: entry.usage.inputTokens,
      outputTokens: entry.usage.outputTokens,
      costUsd: costUsd(
        entry.model,
        entry.usage.inputTokens,
        entry.usage.outputTokens,
      ),
      durationMs: entry.durationMs,
      ok: entry.ok,
      errorCode: entry.errorCode,
      userId: entry.userId,
    },
  });
}
