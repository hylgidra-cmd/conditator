import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { QuestionManager } from "@/frontend/components/admin/question-manager";
import { Link } from "@/i18n/navigation";
import { retakeDays } from "@/backend/personality/service";

export default async function QuestionsPage() {
  await requireAdminPage();
  const [questions, types, days] = await Promise.all([
    db.personalityQuestion.findMany({ orderBy: { sort: "asc" } }),
    db.personalityType.findMany({ orderBy: { code: "asc" } }),
    retakeDays(),
  ]);
  const title = "Savollar va tip tavsiflari";
  const professionsLabel = "Kasb papkalarini boshqarish";
  return (
    <main className="page-x max-w-5xl space-y-6 py-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <AdminNav active="readiness" />
      <Link
        href="/admin/readiness/professions"
        className="text-primary underline"
      >
        {professionsLabel}
      </Link>
      <QuestionManager questions={questions} types={types} retakeDays={days} />
    </main>
  );
}
