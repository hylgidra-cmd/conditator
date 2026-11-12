import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/backend/auth/current-user";

// Vaqtinchalik kabinet: rolga qarab sahifalar keyingi qadamlarda qo'shiladi.
export default async function AccountPage() {
  const user = await currentUser();
  const locale = await getLocale();
  if (!user) return redirect({ href: "/login", locale });

  if (user.role === "STUDENT") {
    return redirect({ href: "/student/cv", locale });
  }
  if (user.role === "COMPANY") {
    return redirect({ href: "/company", locale });
  }
  return redirect({ href: "/admin", locale });
}
