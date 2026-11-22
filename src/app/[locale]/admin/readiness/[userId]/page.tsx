import { requireAdminPage } from "@/backend/admin/page";
import { db } from "@/backend/db";
import { cvDataSchema } from "@/backend/cv/schema";
import { notFound } from "next/navigation";
import { AdminNav } from "@/frontend/components/admin/admin-nav";
import { CandidateControls } from "@/frontend/components/admin/candidate-controls";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdminPage();
  const { userId } = await params;
  const [user, professions] = await Promise.all([
    db.user.findUnique({
      where: { id: userId, role: "STUDENT" },
      select: {
        id: true,
        email: true,
        personalityResults: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            answers: { include: { question: { select: { textUz: true } } } },
          },
        },
        cvs: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { title: true, data: true, savedAt: true },
        },
        professionLinks: {
          include: { profession: { select: { nameUz: true } } },
        },
        readinessProfiles: true,
        userLanguages: true,
      },
    }),
    db.profession.findMany({
      where: { parentId: { not: null }, isActive: true },
      orderBy: { nameUz: "asc" },
      select: { id: true, nameUz: true },
    }),
  ]);
  if (!user) notFound();
  const result = user.personalityResults[0];
  const cv = user.cvs[0];
  const parsed = cv ? cvDataSchema.safeParse(cv.data) : null;
  const data = parsed?.success ? parsed.data : null;
  const title = result ? `${result.typeCode}-${result.identity}` : "";
  const scoreLine = (label: string, value: number) => `${label}: ${value}%`;
  const answerLine = (text: string, value: number) => `${text}: ${value}`;
  const cvLabel = "CV";
  const professionsLabel = "Kasb papkalari";
  return (
    <main className="page-x max-w-5xl space-y-6 py-8">
      <h1 className="text-3xl font-bold">{data?.fullName || user.email}</h1>
      <AdminNav active="readiness" />
      <p>{user.email}</p>
      {result && (
        <section className="border-line rounded-2xl border p-5">
          <h2 className="text-xl font-bold">{title}</h2>
          <p>{result.createdAt.toLocaleDateString()}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Mind", result.mindPct],
              ["Energy", result.energyPct],
              ["Nature", result.naturePct],
              ["Tactics", result.tacticsPct],
              ["Identity", result.identityPct],
            ].map(([label, value]) => (
              <div key={label}>{scoreLine(String(label), Number(value))}</div>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            {result.answers.map((answer) => (
              <p key={answer.questionId} className="text-sm">
                {answerLine(answer.question.textUz, answer.value)}
              </p>
            ))}
          </div>
        </section>
      )}
      <section className="border-line rounded-2xl border p-5">
        <h2 className="text-xl font-bold">{cvLabel}</h2>
        <p>{cv?.title}</p>
        <p>{data?.goal}</p>
        <p>{data?.location}</p>
        <p>{data?.skills.join(", ")}</p>
        <p>
          {data?.languages
            .map((item) => `${item.name} ${item.level ?? ""}`)
            .join(", ")}
        </p>
        <p>
          {data?.experience
            .map((item) => `${item.position ?? ""} ${item.organization}`)
            .join(", ")}
        </p>
      </section>
      <section className="border-line rounded-2xl border p-5">
        <h2 className="text-xl font-bold">{professionsLabel}</h2>
        <p>
          {user.professionLinks
            .filter((item) => item.source !== "ADMIN_EXCLUDED")
            .map((item) => item.profession.nameUz)
            .join(", ")}
        </p>
        <CandidateControls
          userId={user.id}
          resultId={result?.id ?? null}
          professions={professions}
        />
      </section>
    </main>
  );
}
