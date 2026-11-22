import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { ApiError, parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { submitPersonality } from "@/backend/personality/service";
import { rebuildReadiness } from "@/backend/readiness/service";

const schema = z.object({
  answers: z.record(z.string(), z.number().int().min(-3).max(3)),
  consent: z.literal(true),
});

export const POST = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const { answers, consent } = await parseJson(request, schema);
  if (Object.keys(answers).length !== 60) throw new ApiError(400, "VALIDATION");
  const result = await submitPersonality(user.id, answers, consent);
  await rebuildReadiness(user.id);
  return NextResponse.json({ result }, { status: 201 });
});
