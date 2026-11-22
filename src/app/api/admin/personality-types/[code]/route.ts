import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const schema = z.object({
  titleUz: z.string().trim().min(2).max(100),
  titleKk: z.string().trim().min(2).max(100),
  titleRu: z.string().trim().min(2).max(100),
  titleEn: z.string().trim().min(2).max(100),
  descriptionUz: z.string().trim().min(5).max(500),
  descriptionKk: z.string().trim().min(5).max(500),
  descriptionRu: z.string().trim().min(5).max(500),
  descriptionEn: z.string().trim().min(5).max(500),
});

export const PATCH = route<{ params: Promise<{ code: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const code = (await params).code;
    const input = await parseJson(request, schema);
    const existing = await db.personalityType.findUnique({ where: { code } });
    if (!existing) throw new ApiError(404, "NOT_FOUND");
    const type = await db.personalityType.update({
      where: { code },
      data: input,
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PERSONALITY_TYPE_EDIT",
      targetType: "PersonalityType",
      targetId: code,
      details: { fields: Object.keys(input) },
    });
    return NextResponse.json({ type });
  },
);
