import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  type SessionUser,
  userFromToken,
} from "./session";

/**
 * Server komponentlar (sahifalar) uchun joriy foydalanuvchi.
 * `cache`: bitta so'rov ichida (sarlavha + sahifa) baza bir marta so'raladi.
 */
export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token =
    store.get(SESSION_COOKIE)?.value ?? store.get(LEGACY_SESSION_COOKIE)?.value;
  return userFromToken(token);
});
