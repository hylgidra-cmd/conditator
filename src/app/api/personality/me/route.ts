import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import { activeResult } from "@/backend/personality/service";

export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const result = await activeResult(user.id);
  return NextResponse.json({ result });
});

export const DELETE = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  await db.$transaction([
    db.personalityResult.deleteMany({ where: { userId: user.id } }),
    db.personalityDraft.deleteMany({ where: { userId: user.id } }),
    db.readinessProfile.deleteMany({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({ ok: true });
});
