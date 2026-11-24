import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import {
  personalityMatchWeightPct,
  questionsPerTest,
  retakeDays,
} from "@/backend/personality/service";

const schema = z.object({
  retakeDays: z.number().int().min(1).max(365).optional(),
  questionsPerTest: z.number().int().min(10).max(20).optional(),
  personalityMatchWeightPct: z.number().int().min(0).max(20).optional(),
});

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  const [days, perTest, weight] = await Promise.all([
    retakeDays(),
    questionsPerTest(),
    personalityMatchWeightPct(),
  ]);
  return NextResponse.json({
    retakeDays: days,
    questionsPerTest: perTest,
    personalityMatchWeightPct: weight,
  });
});

export const PATCH = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  const input = await parseJson(request, schema);
  const updates: Array<[string, number]> = [];
  if (input.retakeDays !== undefined) {
    updates.push(["personalityRetakeDays", input.retakeDays]);
  }
  if (input.questionsPerTest !== undefined) {
    const normalized = Math.max(
      10,
      Math.min(20, Math.round(input.questionsPerTest / 5) * 5),
    );
    updates.push(["personalityQuestionsPerTest", normalized]);
  }
  if (input.personalityMatchWeightPct !== undefined) {
    updates.push([
      "personalityMatchWeightPct",
      input.personalityMatchWeightPct,
    ]);
  }
  for (const [key, value] of updates) {
    await db.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PERSONALITY_SETTING_EDIT",
      targetType: "Setting",
      targetId: key,
      details: { value },
    });
  }
  return NextResponse.json({ ok: true });
});
