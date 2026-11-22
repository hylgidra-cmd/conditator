import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const schema = z.object({
  textUz: z.string().trim().min(5).max(500).optional(),
  textKk: z.string().trim().min(5).max(500).optional(),
  textRu: z.string().trim().min(5).max(500).optional(),
  textEn: z.string().trim().min(5).max(500).optional(),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const id = (await params).id;
    const input = await parseJson(request, schema);
    const existing = await db.personalityQuestion.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND");
    const question = await db.personalityQuestion.update({
      where: { id },
      data: input,
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PERSONALITY_QUESTION_EDIT",
      targetType: "PersonalityQuestion",
      targetId: id,
      details: { operation: "UPDATE", fields: Object.keys(input) },
    });
    return NextResponse.json({ question });
  },
);

export const DELETE = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const id = (await params).id;
    const existing = await db.personalityQuestion.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND");
    const active = await db.personalityQuestion.count({
      where: {
        isActive: true,
        version: existing.version,
        scale: existing.scale,
      },
    });
    if (active <= 12) throw new ApiError(409, "VALIDATION");
    await db.personalityQuestion.update({
      where: { id },
      data: { isActive: false },
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PERSONALITY_QUESTION_EDIT",
      targetType: "PersonalityQuestion",
      targetId: id,
      details: { operation: "DEACTIVATE" },
    });
    return NextResponse.json({ ok: true });
  },
);
