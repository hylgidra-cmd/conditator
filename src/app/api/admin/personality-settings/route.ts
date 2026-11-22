import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { retakeDays } from "@/backend/personality/service";

const schema = z.object({ retakeDays: z.number().int().min(1).max(365) });

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json({ retakeDays: await retakeDays() });
});

export const PATCH = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  const input = await parseJson(request, schema);
  await db.setting.upsert({
    where: { key: "personalityRetakeDays" },
    create: { key: "personalityRetakeDays", value: String(input.retakeDays) },
    update: { value: String(input.retakeDays) },
  });
  await writeAdminLog({
    adminId: admin.id,
    action: "PERSONALITY_SETTING_EDIT",
    targetType: "Setting",
    targetId: "personalityRetakeDays",
    details: { value: input.retakeDays },
  });
  return NextResponse.json({ ok: true });
});
