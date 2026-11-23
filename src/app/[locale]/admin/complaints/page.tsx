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
    <div className="page-x font-ui max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card/85 shadow-float relative space-y-4 overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-8">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
        />
        <h1 className="text-h2 text-text relative z-10 font-extrabold tracking-tight">
          {t("complaints.title")}
        </h1>
        <div className="relative z-10">
          <AdminNav active="complaints" />
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="border-line bg-card/90 shadow-soft rounded-3xl border p-10 text-center backdrop-blur-md">
          <p className="text-subtle text-sm">{t("complaints.empty")}</p>
        </div>
      ) : (
        <div className="border-line bg-card/90 shadow-soft overflow-x-auto rounded-3xl border backdrop-blur-md">
          <table className="w-full text-left text-sm">
            <thead className="border-line bg-canvas/60 text-subtle border-b text-xs uppercase">
              <tr>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.reporter")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.reported")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.reason")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.status")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.date")}
                </th>
                <th className="px-4 py-3.5 font-bold">
                  {t("complaints.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="text-text px-4 py-3.5">{c.reporter.email}</td>
                  <td className="text-text px-4 py-3.5">
                    {c.reportedUser.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-text font-bold">{c.reason}</p>
                    {c.details ? (
                      <p className="text-subtle text-xs">{c.details}</p>
                    ) : null}
                  </td>
                  <td className="text-primary-text px-4 py-3.5 font-bold">
                    {c.status}
                  </td>
                  <td className="text-subtle px-4 py-3.5 text-xs">
                    {formatDateTime(c.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
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
