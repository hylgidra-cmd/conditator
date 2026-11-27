import { getTranslations } from "next-intl/server";
import { db } from "@/backend/db";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { SkillTemplateManager } from "@/frontend/components/admin/skill-template-manager";

export default async function AdminSkillTemplatesPage() {
  const t = await getTranslations("Admin");
  const areas = await db.profession.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sort: "asc" },
    select: {
      id: true,
      nameUz: true,
      children: {
        where: { isActive: true },
        orderBy: { sort: "asc" },
        select: {
          id: true,
          nameUz: true,
          _count: { select: { skillTemplates: true } },
        },
      },
    },
  });

  const tree = areas.map((a) => ({
    id: a.id,
    nameUz: a.nameUz,
    children: a.children.map((c) => ({
      id: c.id,
      nameUz: c.nameUz,
      skillCount: c._count.skillTemplates,
    })),
  }));

  return (
    <div className="page-x font-ui space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card/85 shadow-float space-y-5 rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
        <h1 className="text-h2 text-text font-extrabold tracking-tight">
          {t("nav.skillTemplates")}
        </h1>
        <AdminNav active="skillTemplates" />
      </div>

      <SkillTemplateManager areas={tree} />
    </div>
  );
}
