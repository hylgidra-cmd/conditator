import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { toggleCandidateLike } from "@/backend/vacancy/application-service";
import { errorResponse } from "@/backend/http/errors";
import { db } from "@/backend/db";

export async function POST(
  req: Request,
  context: { params: Promise<{ cvId: string }> },
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
    const { cvId } = await context.params;
    const result = await toggleCandidateLike({
      companyId: company.id,
      cvId,
    });

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, req);
  }
}
