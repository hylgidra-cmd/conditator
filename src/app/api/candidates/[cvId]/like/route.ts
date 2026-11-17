import { NextResponse } from "next/server";
import { requireApprovedCompany } from "@/backend/company/access";
import { route } from "@/backend/http/route";
import { toggleCandidateLike } from "@/backend/vacancy/application-service";

export const POST = route<{ params: Promise<{ cvId: string }> }>(
  async (request, context) => {
    const { company } = await requireApprovedCompany(request);
    const { cvId } = await context.params;
    const result = await toggleCandidateLike({
      companyId: company.id,
      cvId,
    });

    return NextResponse.json(result);
  },
);
