import { NextResponse } from "next/server";
import { subscriptionSchema } from "@/backend/admin/schema";
import { setSubscription } from "@/backend/admin/service";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

/** Obunani qo'lda yoqish (tugash sanasi bilan) yoki o'chirish (`until: null`). */
export const PATCH = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const admin = await requireRole(request, "ADMIN");
    rateLimit(`admin:${admin.id}`, LIMITS.adminWrite);
    const { until } = await parseJson(request, subscriptionSchema);
    return NextResponse.json({
      company: await setSubscription(admin.id, (await params).id, until),
    });
  },
);
