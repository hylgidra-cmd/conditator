import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { ProfessionManager } from "@/frontend/components/admin/profession-manager";

export default async function ProfessionsPage() {
  await requireAdminPage();
  const professions = await db.profession.findMany({
    orderBy: [{ parentId: "asc" }, { sort: "asc" }],
  });
  const title = "Kasb papkalari";
  return (
    <main className="page-x max-w-5xl space-y-6 py-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <AdminNav active="readiness" />
      <ProfessionManager professions={professions} />
    </main>
  );
}
