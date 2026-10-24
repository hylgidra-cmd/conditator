import { createHash, randomBytes } from "node:crypto";
import type { Role, User } from "@prisma/client";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/http/errors";

export const SESSION_COOKIE = "jumis_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60_000;

export type SessionUser = Pick<
  User,
  "id" | "email" | "role" | "status" | "locale"
>;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  response: NextResponse,
  userId: string,
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // localhost da ham brauzerlar Secure cookie ni qabul qiladi; prod da faqat HTTPS.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Token bo'yicha faol foydalanuvchi. Muddati o'tgan sessiya va bloklangan foydalanuvchi uchun null. */
export async function userFromToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          locale: true,
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session
      .delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }
  if (session.user.status !== "ACTIVE") return null;
  return session.user;
}

export function getSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  return userFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Har bir himoyalangan API endpointning boshida chaqiriladi.
 * Sessiya yo'q bo'lsa 401, rol mos kelmasa 403.
 */
export async function requireRole(
  request: NextRequest,
  ...roles: Role[]
): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) throw new ApiError(401, "UNAUTHORIZED");
  if (roles.length > 0 && !roles.includes(user.role))
    throw new ApiError(403, "FORBIDDEN");
  return user;
}
