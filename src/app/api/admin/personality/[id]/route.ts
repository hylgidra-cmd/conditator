import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { rebuildReadiness } from "@/backend/readiness/service";

const schema = z.object({ reason: z.string().trim().min(5).max(500) });

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const { reason } = await parseJson(request, schema);
    const id = (await params).id;
    const result = await db.personalityResult.findUnique({ where: { id } });
    if (!result) throw new ApiError(404, "NOT_FOUND");
    if (result.invalidatedAt) throw new ApiError(409, "VALIDATION");
    await db.$transaction([
      db.personalityResult.update({
        where: { id },
        data: { invalidatedAt: new Date(), invalidationReason: reason },
      }),
      db.notification.create({
        data: {
          userId: result.userId,
          title: "Test natijasi bekor qilindi",
          body: `Sabab: ${reason}. Testni qayta topshirishingiz mumkin.`,
          link: "/student/personality",
        },
      }),
    ]);
    await rebuildReadiness(result.userId);
    await writeAdminLog({
      adminId: admin.id,
      action: "PERSONALITY_INVALIDATE",
      targetType: "PersonalityResult",
      targetId: id,
      details: { reason },
    });
    return NextResponse.json({ ok: true });
  },
);
