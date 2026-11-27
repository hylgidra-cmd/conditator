const ITEMS = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/companies", key: "companies" },
  { href: "/admin/vacancies", key: "vacancies" },
  { href: "/admin/readiness", key: "readiness" },
  { href: "/admin/skill-templates", key: "skillTemplates" },
  { href: "/admin/complaints", key: "complaints" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/support", key: "support" },
] as const;

/** Navigation is rendered once by AdminStudioShell in admin/layout.tsx. */
export async function AdminNav({
  active: _active,
}: {
  active: (typeof ITEMS)[number]["key"];
}) {
  void _active;
  return null;
}
