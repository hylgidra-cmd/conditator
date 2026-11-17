import { CandidateStageType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedCompany } from "@/backend/company/access";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { updateCandidateStage } from "@/backend/vacancy/application-service";

const stageSchema = z.object({
  stage: z.nativeEnum(CandidateStageType),
  note: z.string().trim().max(1000).optional(),
});

export const POST = route<{ params: Promise<{ id: string; cvId: string }> }>(
  async (request, context) => {
    const { company } = await requireApprovedCompany(request);
    const { id: vacancyId, cvId } = await context.params;
    const { stage, note } = await parseJson(request, stageSchema);

    const result = await updateCandidateStage({
      companyId: company.id,
      vacancyId,
      cvId,
      stage,
      note,
    });

    return NextResponse.json({ ok: true, stage: result });
  },
);
