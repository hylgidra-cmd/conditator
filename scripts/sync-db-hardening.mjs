// Vercel build paytida Company.hasLogo va barcha kompozit indekslar bazada mavjudligini
// kafolatlaydi (idempotent: qayta ishga tushganda xato bermaydi va ma'lumotlarga tegmaydi).
import { PrismaClient } from "@prisma/client";

const STATEMENTS = [
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "hasLogo" BOOLEAN NOT NULL DEFAULT false`,
  `UPDATE "Company" SET "hasLogo" = true WHERE "logoPath" IS NOT NULL AND length("logoPath") > 0 AND "hasLogo" = false`,
  `CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "EmailCode_expiresAt_idx" ON "EmailCode"("expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "Cv_userId_updatedAt_idx" ON "Cv"("userId", "updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "Cv_isVisible_savedAt_idx" ON "Cv"("isVisible", "savedAt")`,
  `CREATE INDEX IF NOT EXISTS "Company_approval_createdAt_idx" ON "Company"("approval", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Company_approval_approvedAt_idx" ON "Company"("approval", "approvedAt")`,
  `CREATE INDEX IF NOT EXISTS "Vacancy_status_createdAt_idx" ON "Vacancy"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Vacancy_status_updatedAt_idx" ON "Vacancy"("status", "updatedAt")`,
  `CREATE INDEX IF NOT EXISTS "Vacancy_status_expiresAt_idx" ON "Vacancy"("status", "expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "VacancyApplication_studentId_createdAt_idx" ON "VacancyApplication"("studentId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "VacancyApplication_cvId_idx" ON "VacancyApplication"("cvId")`,
  `CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_readAt_idx" ON "ChatMessage"("conversationId", "readAt")`,
  `CREATE INDEX IF NOT EXISTS "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Payment_companyId_createdAt_idx" ON "Payment"("companyId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "VacancyUnlock_companyId_expiresAt_idx" ON "VacancyUnlock"("companyId", "expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "SupportMessage_threadId_readAt_idx" ON "SupportMessage"("threadId", "readAt")`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("sync-db-hardening: DATABASE_URL yo'q, o'tkazib yuborildi.");
    return;
  }
  const prisma = new PrismaClient();
  try {
    for (const sql of STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Jadval hali yaratilmagan bo'lsa ham boshqa indekslarni to'xtatmaydi.
        console.warn("sync-db-hardening ogohlantirish:", err?.message ?? err);
      }
    }
    console.log(
      `sync-db-hardening: ${STATEMENTS.length} ta baza optimizatsiyasi tekshirildi.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("sync-db-hardening xato:", err);
  process.exit(1);
});
