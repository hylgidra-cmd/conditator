import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/backend/auth/session";
import { setOwnCvVisibility } from "@/backend/cv/service";
import { parseJson } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

const bodySchema = z.object({ isVisible: z.boolean() });

export const PATCH = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const { isVisible } = await parseJson(request, bodySchema);
  return NextResponse.json({
    cv: await setOwnCvVisibility(user.id, isVisible),
  });
});
