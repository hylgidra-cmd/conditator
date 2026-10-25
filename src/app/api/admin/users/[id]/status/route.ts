import { NextResponse } from "next/server";
import { userStatusSchema } from "@/lib/admin/schema";
import { setUserStatus } from "@/lib/admin/service";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireRole } from "@/lib/auth/session";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

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
