import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { resolveComplaint } from "@/backend/chat/service";
import { errorResponse } from "@/backend/http/errors";
import { ComplaintStatus } from "@prisma/client";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole(request, "ADMIN");
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status =
      body.status === ComplaintStatus.DISMISSED
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
  } catch (err) {
    return errorResponse(err, request);
  }
}
