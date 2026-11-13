import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { ComplaintResolveButtons } from "@/frontend/components/admin/complaint-resolve-buttons";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDateTime } from "@/backend/format-date";

export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage() {
  await requireAdminPage();
  const t = await getTranslations("Admin");

  const complaints = await db.complaint.findMany({
    include: {
      reporter: { select: { email: true } },
      reportedUser: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{t("complaints.title")}</h1>
        <AdminNav active="complaints" />
      </div>

      {complaints.length === 0 ? (
        <p className="text-muted text-sm">{t("complaints.empty")}</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-border border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3">{t("complaints.reporter")}</th>
                <th className="px-4 py-3">{t("complaints.reported")}</th>
                <th className="px-4 py-3">{t("complaints.reason")}</th>
                <th className="px-4 py-3">{t("complaints.status")}</th>
                <th className="px-4 py-3">{t("complaints.date")}</th>
                <th className="px-4 py-3">{t("complaints.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.reporter.email}</td>
                  <td className="px-4 py-3">{c.reportedUser.email}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.reason}</p>
                    {c.details ? (
                      <p className="text-muted text-xs">{c.details}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.status}</td>
                  <td className="text-muted px-4 py-3 text-xs">
                    {formatDateTime(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ComplaintResolveButtons id={c.id} status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
