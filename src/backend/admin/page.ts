import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";

/** Admin sahifalari: kirmagan → login, boshqa rol → kabinet. API lar alohida `requireRole(request, "ADMIN")` bilan 403 qaytaradi. */
export async function requireAdminPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });
  if (user.role !== "ADMIN") return redirect({ href: "/account", locale });
  return { user, locale };
}
