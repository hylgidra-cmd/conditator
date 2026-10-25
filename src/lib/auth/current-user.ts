import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE, type SessionUser, userFromToken } from "./session";

/**
 * Server komponentlar (sahifalar) uchun joriy foydalanuvchi.
 * `cache`: bitta so'rov ichida (sarlavha + sahifa) baza bir marta so'raladi.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
});
