import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { saveAttemptAnswers } from "@/backend/personality/service";

const schema = z.object({
  answers: z.record(
    z.string().min(1).max(80),
    z.union([z.string().min(1).max(40), z.number().int().min(-2).max(2)]),
  ),
});

export const PUT = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request, "STUDENT");
    const { id } = await params;
    const input = await parseJson(request, schema);
    const saved = await saveAttemptAnswers(user.id, id, input.answers);
    return NextResponse.json(saved);
  },
);
