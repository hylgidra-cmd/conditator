import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ApiError, parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

const bodySchema = z.object({ approved: z.boolean() });

/** Admin kompaniyani tasdiqlaydi yoki rad etadi. Admin sahifasi 2.2-qadamda. */
export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    await requireRole(request, "ADMIN");
    const { id } = await params;
    const { approved } = await parseJson(request, bodySchema);
    const company = await db.company
      .update({
        where: { id },
        data: approved
          ? { approval: "APPROVED", approvedAt: new Date() }
          : { approval: "REJECTED", approvedAt: null },
        select: { id: true, approval: true, approvedAt: true },
      })
      .catch(() => null);
    if (!company) throw new ApiError(404, "NOT_FOUND");
    return NextResponse.json({ company });
  },
);
