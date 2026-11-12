import { NextResponse } from "next/server";
import { userStatusSchema } from "@/backend/admin/schema";
import { setUserStatus } from "@/backend/admin/service";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Bloklash / blokdan chiqarish. Harakat AdminLog ga yoziladi. */
export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    rateLimit(`admin:${admin.id}`, LIMITS.adminWrite);
    const { status } = await parseJson(request, userStatusSchema);
    return NextResponse.json({
      user: await setUserStatus(admin.id, (await params).id, status),
    });
  },
);
