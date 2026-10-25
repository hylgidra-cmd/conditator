import { NextResponse } from "next/server";
import { z } from "zod";
import { setCompanyApproval } from "@/lib/admin/service";
import { LIMITS, rateLimit } from "@/lib/auth/rate-limit";
import { requireRole } from "@/lib/auth/session";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

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
