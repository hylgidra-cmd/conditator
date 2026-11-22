import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { professionSchema } from "../route";

const patchSchema = professionSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const id = (await params).id;
    const input = await parseJson(request, patchSchema);
    const existing = await db.profession.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "NOT_FOUND");
    if (input.parentId === id) throw new ApiError(400, "VALIDATION");
    if (input.parentId) {
      const parent = await db.profession.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || parent.parentId) throw new ApiError(400, "VALIDATION");
    }
    const profession = await db.profession.update({
      where: { id },
      data: input,
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PROFESSION_EDIT",
      targetType: "Profession",
      targetId: id,
      details: { operation: "UPDATE", fields: Object.keys(input) },
    });
    return NextResponse.json({ profession });
  },
);

export const DELETE = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const id = (await params).id;
    const existing = await db.profession.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, users: true, readiness: true } },
      },
    });
    if (!existing) throw new ApiError(404, "NOT_FOUND");
    if (
      existing._count.children ||
      existing._count.users ||
      existing._count.readiness
    )
      throw new ApiError(409, "VALIDATION");
    await db.profession.delete({ where: { id } });
    await writeAdminLog({
      adminId: admin.id,
      action: "PROFESSION_EDIT",
      targetType: "Profession",
      targetId: id,
      details: { operation: "DELETE" },
    });
    return NextResponse.json({ ok: true });
  },
);
