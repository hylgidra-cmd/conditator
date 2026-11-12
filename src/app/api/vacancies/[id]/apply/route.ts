import { NextResponse } from "next/server";
import { currentUser } from "@/backend/auth/current-user";
import { applyToVacancy } from "@/backend/vacancy/application-service";
import { errorResponse } from "@/backend/http/errors";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id: vacancyId } = await context.params;
    const body = await req.json();
    const { cvId, note } = body;

    const application = await applyToVacancy({
      studentId: user.id,
      vacancyId,
      cvId,
      note,
    });

    return NextResponse.json({ ok: true, application });
  } catch (err) {
    return errorResponse(err, req);
  }
}
