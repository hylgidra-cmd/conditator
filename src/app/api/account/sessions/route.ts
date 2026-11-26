import { NextResponse } from "next/server";
import { rateLimit } from "@/backend/auth/rate-limit";
import {
  deleteOtherSessions,
  hashToken,
  LEGACY_SESSION_COOKIE,
  requireRole,
  SESSION_COOKIE,
} from "@/backend/auth/session";
import { parseUserAgent } from "@/backend/auth/user-agent";
import { db } from "@/backend/db";
import { ApiError } from "@/backend/http/errors";
import { clientIp } from "@/backend/http/request";
import { route } from "@/backend/http/route";

export const GET = route(async (request) => {
  const user = await requireRole(request);
  const currentToken =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  // Agar joriy sessiyaning userAgent/ipAddress maydoni bo'sh bo'lsa (eski kirish), uni yangilab qo'yamiz
  if (currentHash) {
    const ua = request.headers.get("user-agent");
    const ip = clientIp(request);
    await db.session
      .updateMany({
        where: { userId: user.id, tokenHash: currentHash, userAgent: null },
        data: {
          userAgent: ua ? ua.slice(0, 300) : null,
          ipAddress: ip ? ip.slice(0, 64) : null,
        },
      })
      .catch(() => undefined);
  }

  const now = new Date();
  const rows = await db.session.findMany({
    where: { userId: user.id, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      tokenHash: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const sessions = rows.map((row) => {
    const parsed = parseUserAgent(row.userAgent);
    return {
      id: row.id,
      browser: parsed.browser,
      os: parsed.os,
      isMobile: parsed.isMobile,
      deviceLabel: parsed.label,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      isCurrent: Boolean(currentHash && row.tokenHash === currentHash),
    };
  });

  return NextResponse.json({ ok: true, sessions });
});

export const DELETE = route(async (request) => {
  const user = await requireRole(request);
  rateLimit(`account-sessions:${user.id}`, { max: 30, windowMs: 10 * 60_000 });

  const currentToken =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  const scope = request.nextUrl.searchParams.get("scope");
  if (scope === "others") {
    await deleteOtherSessions(user.id, currentToken);
    return NextResponse.json({ ok: true });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    throw new ApiError(400, "VALIDATION");
  }

  const target = await db.session.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true, tokenHash: true },
  });

  if (!target) {
    throw new ApiError(404, "NOT_FOUND");
  }

  if (currentHash && target.tokenHash === currentHash) {
    throw new ApiError(400, "CANNOT_REVOKE_CURRENT_SESSION");
  }

  await db.session.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
});
