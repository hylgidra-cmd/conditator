import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const schema = z.object({
  typeCodes: z.array(z.string().regex(/^[IE][NS][TF][JP]$/)).max(8),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const { id } = await params;
    const input = await parseJson(request, schema);
    const prof = await db.profession.findUnique({ where: { id } });
    if (!prof) throw new ApiError(404, "NOT_FOUND");
    const unique = [...new Set(input.typeCodes)];
    const saved = await db.professionTypeSuggestion.upsert({
      where: { professionId: id },
      create: { professionId: id, typeCodes: unique },
      update: { typeCodes: unique },
    });
    await writeAdminLog({
      adminId: admin.id,
      action: "PROFESSION_EDIT",
      targetType: "Profession",
      targetId: id,
      details: { suggestedTypes: unique },
    });
    return NextResponse.json({ suggestion: saved });
  },
);
