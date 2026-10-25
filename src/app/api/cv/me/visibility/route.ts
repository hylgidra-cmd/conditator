import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { setOwnCvVisibility } from "@/lib/cv/service";
import { parseJson } from "@/lib/http/errors";
import { route } from "@/lib/http/route";

const bodySchema = z.object({ isVisible: z.boolean() });

export const PATCH = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const { isVisible } = await parseJson(request, bodySchema);
  return NextResponse.json({
    cv: await setOwnCvVisibility(user.id, isVisible),
  });
});
