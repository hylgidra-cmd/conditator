import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth/session";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { route } from "@/backend/http/route";

export const GET = route<{ params: Promise<{ userId: string }> }>(
  async (request, { params }) => {
    await requireRole(request, "ADMIN");
    const user = await db.user.findUnique({
      where: { id: (await params).userId, role: "STUDENT" },
      select: {
        id: true,
        email: true,
        status: true,
        personalityResults: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            answers: { include: { question: { select: { textUz: true } } } },
          },
        },
        cvs: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { id: true, data: true, title: true, savedAt: true },
        },
        professionLinks: {
          include: { profession: { select: { id: true, nameUz: true } } },
        },
        readinessProfiles: true,
        userLanguages: true,
      },
    });
    if (!user) throw new ApiError(404, "NOT_FOUND");
    return NextResponse.json({ user });
  },
);
