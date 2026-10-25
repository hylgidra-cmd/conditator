import { getLocale, getTranslations } from "next-intl/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { Link, redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/auth/current-user";

// Vaqtinchalik kabinet: rolga qarab sahifalar keyingi qadamlarda qo'shiladi.
export default async function AccountPage() {
  const user = await currentUser();
  if (!user) return redirect({ href: "/login", locale: await getLocale() });

  const t = await getTranslations("Account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="border-border bg-surface space-y-4 rounded-2xl border p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">{t("email")}</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted">{t("role")}</dt>
          <dd>{t(`roles.${user.role}`)}</dd>
        </dl>
        {user.role === "STUDENT" ? (
          <Link
            href="/student/cv"
            className="bg-brand inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {t("cvLink")}
          </Link>
        ) : user.role === "COMPANY" ? (
          <Link
            href="/company"
            className="bg-brand inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {t("companyLink")}
          </Link>
        ) : (
          <p className="text-muted text-sm">{t("comingSoon")}</p>
        )}
        <LogoutButton className="border-border rounded-lg border px-4 py-2 text-sm font-medium" />
      </div>
    </div>
  );
}
