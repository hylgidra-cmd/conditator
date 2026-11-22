import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminLog } from "@/backend/admin/log";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { rebuildReadiness } from "@/backend/readiness/service";

const schema = z.object({
  professionId: z.string().min(1).max(100),
  action: z.enum(["ADD", "REMOVE"]),
});

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    const userId = (await params).id;
    const { professionId, action } = await parseJson(request, schema);
    const [user, profession] = await Promise.all([
      db.user.findUnique({
        where: { id: userId, role: "STUDENT" },
        select: { id: true },
      }),
      db.profession.findUnique({
        where: { id: professionId },
        select: { parentId: true },
      }),
    ]);
    if (!user || !profession?.parentId) throw new ApiError(404, "NOT_FOUND");
    if (action === "ADD")
      await db.userProfession.upsert({
        where: { userId_professionId: { userId, professionId } },
        create: { userId, professionId, source: "ADMIN", confidence: 100 },
        update: { source: "ADMIN", confidence: 100 },
      });
    else
      await db.userProfession.upsert({
        where: { userId_professionId: { userId, professionId } },
        create: {
          userId,
          professionId,
          source: "ADMIN_EXCLUDED",
          confidence: 0,
        },
        update: { source: "ADMIN_EXCLUDED", confidence: 0 },
      });
    await rebuildReadiness(userId);
    await writeAdminLog({
      adminId: admin.id,
      action: "USER_PROFESSION_EDIT",
      targetType: "User",
      targetId: userId,
      details: { professionId, action },
    });
    return NextResponse.json({ ok: true });
  },
);
