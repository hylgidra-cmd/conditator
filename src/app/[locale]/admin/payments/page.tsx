import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { AdminPaymentRowActions } from "@/frontend/components/admin/payment-actions";
import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { formatDateTime } from "@/backend/format-date";
import {
  MANUAL_CARD_HOLDER,
  MANUAL_CARD_NUMBER,
} from "@/backend/payment/service";

export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<string, string> = {
  CV_CREATION: "CV yaratish va faollashtirish",
  CV_ACTIVATION: "CV faollashtirish",
  WEEKLY_APPLY_PASS: "7 kunlik ariza ruxsatnomasi",
  VACANCY_UNLOCK: "Kompaniya obunasi",
  SUBSCRIPTION: "Kompaniya obunasi",
};

export default async function AdminPaymentsPage() {
  await requireAdminPage();
  const t = await getTranslations("Admin");

  const [payments, completedAgg, pendingCount] = await Promise.all([
    db.payment.findMany({
      select: {
        id: true,
        purpose: true,
        amount: true,
        status: true,
        externalId: true,
        createdAt: true,
        user: { select: { email: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.payment.count({ where: { status: "PENDING" } }),
  ]);

  const paymentIds = payments.map((p) => p.id);
  const metaRows =
    paymentIds.length > 0
      ? await db.$queryRaw<
          Array<{
            id: string;
            hasReceipt: boolean;
            note: string | null;
            planName: string | null;
            durationDays: number | null;
          }>
        >(Prisma.sql`
          SELECT id,
            COALESCE(length("transactionDetails"->>'receiptDataUrl') > 0, false) AS "hasReceipt",
            "transactionDetails"->>'note' AS "note",
            "transactionDetails"->>'planName' AS "planName",
            CASE
              WHEN ("transactionDetails"->>'durationDays') ~ '^[0-9]+$'
              THEN ("transactionDetails"->>'durationDays')::int
              ELSE NULL
            END AS "durationDays"
          FROM "Payment"
          WHERE id IN (${Prisma.join(paymentIds)})
        `)
      : [];
  const metaMap = new Map(metaRows.map((row) => [row.id, row]));

  const totalRevenue = completedAgg._sum.amount ?? 0;
  const cardSummary = `${MANUAL_CARD_NUMBER} · ${MANUAL_CARD_HOLDER}`;

  return (
    <div className="page-x font-ui max-w-6xl space-y-6 py-8 sm:py-12">
      <div className="border-line bg-card shadow-soft relative space-y-4 overflow-hidden rounded-2xl border p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-h2 text-text font-extrabold tracking-tight">
              {t("payments.title")}
            </h1>
            <p className="text-subtle mt-1 font-mono text-xs font-semibold sm:text-sm">
              {cardSummary}
            </p>
          </div>
          <AdminNav active="payments" />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border-line bg-card shadow-soft rounded-2xl border p-5">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.totalRevenue")}
          </p>
          <p className="text-primary-text mt-1.5 text-2xl font-extrabold tabular-nums">
            {totalRevenue.toLocaleString("en-US")}
          </p>
        </div>
        <div className="border-line bg-card shadow-soft rounded-2xl border p-5">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.completedCount")}
          </p>
          <p className="text-success mt-1.5 text-2xl font-extrabold tabular-nums">
            {completedAgg._count._all}
          </p>
        </div>
        <div className="border-line bg-card shadow-soft rounded-2xl border p-5">
          <p className="text-subtle text-xs font-semibold">
            {t("payments.pendingCount")}
          </p>
          <p className="text-text mt-1.5 text-2xl font-extrabold tabular-nums">
            {pendingCount}
          </p>
        </div>
      </section>

      {payments.length === 0 ? (
        <div className="border-line bg-card shadow-soft rounded-2xl border p-10 text-center">
          <p className="text-subtle text-sm">{t("payments.empty")}</p>
        </div>
      ) : (
        <>
          {/* Mobile card list (phones) */}
          <ul className="space-y-3 md:hidden">
            {payments.map((p) => {
              const details = metaMap.get(p.id);
              const hasReceipt = Boolean(details?.hasReceipt);
              const purposeDisplay =
                details?.planName && details?.durationDays
                  ? `Obuna — ${details.planName} (${details.durationDays} kun)`
                  : (PURPOSE_LABELS[p.purpose] ?? p.purpose);
              const amountDisplay = `${p.amount.toLocaleString("en-US")} so'm`;

              return (
                <li
                  key={p.id}
                  className="border-line bg-card shadow-soft space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-text truncate text-sm font-extrabold">
                        {p.company?.name ?? p.user.email}
                      </p>
                      <p className="text-subtle truncate text-xs">
                        {p.user.email}
                      </p>
                      {p.externalId ? (
                        <p className="text-primary-text mt-0.5 font-mono text-[11px] font-bold">
                          {p.externalId}
                        </p>
                      ) : null}
                    </div>
                    <span className="bg-primary-soft text-primary-text shrink-0 rounded-xl px-2.5 py-1 text-xs font-black tabular-nums">
                      {amountDisplay}
                    </span>
                  </div>

                  <div className="border-line bg-canvas/70 space-y-1 rounded-2xl border p-3 text-xs">
                    <p className="text-text font-bold">{purposeDisplay}</p>
                    {details?.note ? (
                      <p className="text-subtle">{details.note}</p>
                    ) : null}
                    <p className="text-subtle text-[11px]">
                      {formatDateTime(p.createdAt)}
                    </p>
                  </div>

                  <AdminPaymentRowActions
                    paymentId={p.id}
                    initialStatus={p.status}
                    hasReceipt={hasReceipt}
                  />
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <div className="border-line bg-card shadow-soft hidden overflow-x-auto rounded-2xl border md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-line bg-canvas/60 text-subtle border-b text-xs uppercase">
                <tr>
                  <th className="px-4 py-3.5 font-bold">
                    {t("payments.user")}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {t("payments.purpose")}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {t("payments.amount")}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {t("payments.date")}
                  </th>
                  <th className="px-4 py-3.5 font-bold">
                    {t("payments.status")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {payments.map((p) => {
                  const details = metaMap.get(p.id);
                  const hasReceipt = Boolean(details?.hasReceipt);
                  const purposeDisplay =
                    details?.planName && details?.durationDays
                      ? `Obuna — ${details.planName} (${details.durationDays} kun)`
                      : (PURPOSE_LABELS[p.purpose] ?? p.purpose);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-canvas/50 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-text font-bold">
                          {p.company?.name ?? p.user.email}
                        </p>
                        <p className="text-subtle text-xs">{p.user.email}</p>
                        {p.externalId ? (
                          <p className="text-primary-text mt-0.5 font-mono text-[11px] font-bold">
                            {p.externalId}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-text px-4 py-3.5 text-xs font-semibold">
                        <span>{purposeDisplay}</span>
                        {details?.note ? (
                          <p className="text-subtle mt-0.5 text-[11px]">
                            {details.note}
                          </p>
                        ) : null}
                      </td>
                      <td className="text-text px-4 py-3.5 font-bold tabular-nums">
                        {p.amount.toLocaleString("en-US")}
                      </td>
                      <td className="text-subtle px-4 py-3.5 text-xs">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <AdminPaymentRowActions
                          paymentId={p.id}
                          initialStatus={p.status}
                          hasReceipt={hasReceipt}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
