import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";
import { activeResult } from "@/backend/personality/service";

export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const [result, cvCount] = await Promise.all([
    activeResult(user.id),
    db.cv.count({ where: { userId: user.id, savedAt: { not: null } } }),
  ]);
  return NextResponse.json({
    testComplete: Boolean(result),
    cvComplete: cvCount > 0,
  });
});
