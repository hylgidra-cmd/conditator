import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";
import { finishAttempt } from "@/backend/personality/service";
import { rebuildReadiness } from "@/backend/readiness/service";

const schema = z.object({
  consent: z.boolean().default(true),
  locale: z.enum(["uz", "kk", "ru", "en"]).optional(),
});

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request, "STUDENT");
    const { id } = await params;
    const input = await parseJson(request, schema);
    const result = await finishAttempt(
      user.id,
      id,
      input.consent,
      input.locale ?? user.locale,
    );
    await rebuildReadiness(user.id);
    return NextResponse.json({ result });
  },
);
