import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const professionSchema = z.object({
  parentId: z.string().min(1).max(100).nullable().optional(),
  nameUz: z.string().trim().min(2).max(150),
  nameKk: z.string().trim().min(2).max(150),
  nameRu: z.string().trim().min(2).max(150),
  nameEn: z.string().trim().min(2).max(150),
  keywords: z.array(z.string().trim().min(2).max(100)).max(30),
  educationFields: z
    .array(z.string().trim().min(2).max(150))
    .max(50)
    .default([]),
  sort: z.number().int().min(0).max(9999).default(0),
});

export const GET = route(async (request) => {
  await requireRole(request, "ADMIN");
  return NextResponse.json({
    professions: await db.profession.findMany({
      orderBy: [{ parentId: "asc" }, { sort: "asc" }],
    }),
  });
});

export const POST = route(async (request) => {
  const admin = await requireRole(request, "ADMIN");
  const input = await parseJson(request, professionSchema);
  if (input.parentId) {
    const parent = await db.profession.findUnique({
      where: { id: input.parentId },
    });
    if (!parent || parent.parentId) throw new ApiError(400, "VALIDATION");
  }
  const profession = await db.profession.create({ data: input });
  await writeAdminLog({
    adminId: admin.id,
    action: "PROFESSION_EDIT",
    targetType: "Profession",
    targetId: profession.id,
    details: { operation: "CREATE" },
  });
  return NextResponse.json({ profession }, { status: 201 });
});
