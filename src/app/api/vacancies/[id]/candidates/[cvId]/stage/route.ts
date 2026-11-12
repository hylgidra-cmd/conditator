import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { updateCandidateStage } from "@/backend/vacancy/application-service";
import { errorResponse } from "@/backend/http/errors";
import { db } from "@/backend/db";
import { CandidateStageType } from "@prisma/client";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; cvId: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "COMPANY") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const company = await db.company.findUnique({ where: { userId: user.id } });
  if (!company) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const { id: vacancyId, cvId } = await context.params;
    const body = await req.json();
    const { stage, note } = body;

    const result = await updateCandidateStage({
      companyId: company.id,
      vacancyId,
      cvId,
      stage: stage as CandidateStageType,
      note,
    });

    return NextResponse.json({ ok: true, stage: result });
  } catch (err) {
    return errorResponse(err, req);
  }
}
