import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS, rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { createComplaint } from "@/backend/chat/service";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const complaintSchema = z.object({
  reportedUserId: z.string().min(1).max(64),
  conversationId: z.string().min(1).max(64).optional(),
  reason: z.string().trim().min(2).max(200),
  details: z.string().trim().max(2000).optional(),
});

export const POST = route(async (request) => {
  const user = await requireRole(request);
  rateLimit(`complaint:${user.id}`, LIMITS.complaintCreate);
  const body = await parseJson(request, complaintSchema);

  const complaint = await createComplaint({
    reporterId: user.id,
    reportedUserId: body.reportedUserId,
    conversationId: body.conversationId,
    reason: body.reason,
    details: body.details,
  });

  return NextResponse.json({ ok: true, complaint });
});
