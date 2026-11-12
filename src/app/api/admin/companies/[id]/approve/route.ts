import { NextResponse } from "next/server";
import { z } from "zod";
import { setCompanyApproval } from "@/backend/admin/service";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const bodySchema = z.object({ approved: z.boolean() });

/** Admin kompaniyani tasdiqlaydi yoki rad etadi. Harakat AdminLog ga yoziladi. */
export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    rateLimit(`admin:${admin.id}`, LIMITS.adminWrite);
    const { approved } = await parseJson(request, bodySchema);
    const company = await setCompanyApproval(
      admin.id,
      (await params).id,
      approved,
    );
    return NextResponse.json({ company });
  },
);
