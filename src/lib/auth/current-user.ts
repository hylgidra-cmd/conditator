import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, type SessionUser, userFromToken } from "./session";

/** Server komponentlar (sahifalar) uchun joriy foydalanuvchi. */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
}
