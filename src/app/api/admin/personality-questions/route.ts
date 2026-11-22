import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const schema = z.object({
  id: z.string().regex(/^[a-z0-9-]{3,80}$/),
  scale: z.enum(["MIND", "ENERGY", "NATURE", "TACTICS", "IDENTITY"]),
  direction: z.union([z.literal(1), z.literal(-1)]),
  sort: z.number().int().min(0).max(999),
  textUz: z.string().trim().min(5).max(500),
  textKk: z.string().trim().min(5).max(500),
  textRu: z.string().trim().min(5).max(500),
  textEn: z.string().trim().min(5).max(500),
});

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json({
    questions: await db.personalityQuestion.findMany({
      orderBy: { sort: "asc" },
    }),
  });
});

export const POST = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  const input = await parseJson(request, schema);
  const question = await db.personalityQuestion.create({
    data: { ...input, version: 1 },
  });
  await writeAdminLog({
    adminId: admin.id,
    action: "PERSONALITY_QUESTION_EDIT",
    targetType: "PersonalityQuestion",
    targetId: question.id,
    details: { operation: "CREATE" },
  });
  return NextResponse.json({ question }, { status: 201 });
});
