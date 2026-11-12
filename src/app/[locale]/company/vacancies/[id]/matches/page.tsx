import type { Lang } from "@prisma/client";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DecisionBadge } from "@/frontend/components/match/decision-badge";
import { MatchPanel } from "@/frontend/components/match/match-panel";
import { FormAlert } from "@/frontend/components/ui/form";
import { Link } from "@/i18n/navigation";
import { companyAccess } from "@/backend/company/access";
import { requireCompanyPage } from "@/backend/company/page";
import { db } from "@/backend/db";
import { listDecided } from "@/backend/match/decision";
import { getMatchResults } from "@/backend/match/service";
import { formatDate } from "@/backend/format-date";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { company, locale } = await requireCompanyPage();
  const t = await getTranslations("Matches");
  const tStatus = await getTranslations("Company.status");
  const { id } = await params;
  // Faqat o'z talabi: boshqa kompaniyaniki "topilmadi".
  const vacancy = await db.vacancy.findFirst({
    where: { id, companyId: company.id },
  });
  if (!vacancy) notFound();

  // Tasdiqlanmagan kompaniya natijalarni ko'rmaydi (API ham 403 qaytaradi).
  const access = companyAccess(company);
  const [initial, decided] = access.canViewCvs
    ? await Promise.all([
        getMatchResults(company, vacancy, locale as Lang),
        listDecided(vacancy.id),
      ])
    : [null, []];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <Link
          href="/company/vacancies"
          className="text-brand text-sm font-medium hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="text-2xl font-bold break-words">
          {t("title", { title: vacancy.title })}
        </h1>
      </div>
      {initial ? (
        <MatchPanel vacancyId={vacancy.id} initial={initial} />
      ) : (
        <FormAlert>
          {tStatus(company.approval === "REJECTED" ? "REJECTED" : "PENDING")}
        </FormAlert>
      )}
      {decided.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("decided")}</h2>
          <ul className="space-y-2">
            {decided.map((item) => (
              <li
                key={item.cvId}
                className="border-border bg-surface flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DecisionBadge decision={item.decision} />
                  <span className="min-w-0 break-words">
                    {[item.skills.slice(0, 5).join(", "), item.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="text-muted text-xs">
                    {formatDate(item.updatedAt)}
                  </span>
                </div>
                <Link
                  href={`/company/vacancies/${vacancy.id}/candidates/${item.cvId}`}
                  className="text-brand font-semibold hover:underline"
                >
                  {t("openCv")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
