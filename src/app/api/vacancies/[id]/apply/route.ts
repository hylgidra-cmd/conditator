import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { applyToVacancy } from "@/backend/vacancy/application-service";

const applySchema = z.object({
  cvId: z.string().min(1).max(64),
  note: z.string().trim().max(1500).optional(),
});

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, context) => {
    const user = await requireRole(request, "STUDENT");
    const { id: vacancyId } = await context.params;
    const { cvId, note } = await parseJson(request, applySchema);

    const application = await applyToVacancy({
      studentId: user.id,
      vacancyId,
      cvId,
      note,
    });

    return NextResponse.json({ ok: true, application });
  },
);
