import { NextResponse } from "next/server";
import { rateLimit } from "@/backend/auth/rate-limit";
import { requireRole } from "@/backend/auth/session";
import { route } from "@/backend/http/route";
import {
  removeVacancyBookmark,
  saveVacancyBookmark,
} from "@/backend/vacancy/bookmarks";

export const POST = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request);
    rateLimit(`bookmark:${user.id}`, { max: 60, windowMs: 10 * 60_000 });
    const { id } = await params;
    const result = await saveVacancyBookmark(user.id, id);
    return NextResponse.json({ ok: true, ...result });
  },
);

export const DELETE = route<{ params: Promise<{ id: string }> }>(
  async (request, { params }) => {
    const user = await requireRole(request);
    rateLimit(`bookmark:${user.id}`, { max: 60, windowMs: 10 * 60_000 });
    const { id } = await params;
    const result = await removeVacancyBookmark(user.id, id);
    return NextResponse.json({ ok: true, ...result });
  },
);
