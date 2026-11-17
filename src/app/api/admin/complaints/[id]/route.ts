import { ComplaintStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { resolveComplaint } from "@/backend/chat/service";
import { db } from "@/backend/db";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const resolveSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]).default("RESOLVED"),
});

export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const admin = await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const body = await parseJson(request, resolveSchema);
    const status =
      body.status === "DISMISSED"
        ? ComplaintStatus.DISMISSED
        : ComplaintStatus.RESOLVED;

    const updated = await resolveComplaint(admin.id, id, status);
    await db.adminLog.create({
      data: {
        adminId: admin.id,
        action: "RESOLVE_COMPLAINT",
        targetType: "Complaint",
        targetId: id,
        details: { status },
      },
    });

    return NextResponse.json({ ok: true, complaint: updated });
  },
);
