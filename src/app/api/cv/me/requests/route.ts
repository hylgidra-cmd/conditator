import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { route } from "@/backend/http/route";

/**
 * Talaba o'z CV larini "SELECTED" deb belgilagan kompaniya so'rovlarini ko'radi.
 */
export const GET = route(async (request) => {
  const user = await requireRole(request, "STUDENT");
  const matches = await db.match.findMany({
    where: {
      decision: "SELECTED",
      cv: { userId: user.id },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      score: true,
      reason: true,
      updatedAt: true,
      cvId: true,
      cv: { select: { title: true } },
      vacancy: {
        select: {
          id: true,
          title: true,
          location: true,
          workType: true,
          company: { select: { id: true, name: true, country: true } },
        },
      },
    },
  });

  return NextResponse.json({ requests: matches });
});
