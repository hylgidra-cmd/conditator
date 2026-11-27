// Vercel build paytida Company.hasLogo va barcha kompozit indekslar bazada mavjudligini
// kafolatlaydi (idempotent: qayta ishga tushganda xato bermaydi va ma'lumotlarga tegmaydi).
import { PrismaClient } from "@prisma/client";

const STATEMENTS = [
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "hasLogo" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fullName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "educationSummary" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
  `ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT`,
  `ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "website" TEXT`,
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT`,
  `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "description" TEXT`,
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
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SKILL_TEMPLATE_EDIT'`,
  `ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SKILL_TEMPLATE_IMPORT'`,
  `CREATE TABLE IF NOT EXISTS "ProfessionSkillTemplate" ("id" TEXT NOT NULL, "professionId" TEXT NOT NULL, "position" INTEGER NOT NULL, "nameUz" TEXT NOT NULL, "nameKk" TEXT NOT NULL, "nameRu" TEXT NOT NULL, "nameEn" TEXT NOT NULL, "descriptionUz" TEXT NOT NULL, "descriptionKk" TEXT NOT NULL, "descriptionRu" TEXT NOT NULL, "descriptionEn" TEXT NOT NULL, "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[], "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedById" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProfessionSkillTemplate_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "CvSkillMatch" ("id" TEXT NOT NULL, "cvId" TEXT NOT NULL, "professionId" TEXT NOT NULL, "matchedCount" INTEGER NOT NULL DEFAULT 0, "matchedSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[], "missingSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[], "recalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CvSkillMatch_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionSkillTemplate_professionId_position_key" ON "ProfessionSkillTemplate"("professionId", "position")`,
  `CREATE INDEX IF NOT EXISTS "ProfessionSkillTemplate_professionId_isActive_position_idx" ON "ProfessionSkillTemplate"("professionId", "isActive", "position")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CvSkillMatch_cvId_professionId_key" ON "CvSkillMatch"("cvId", "professionId")`,
  `CREATE INDEX IF NOT EXISTS "CvSkillMatch_professionId_matchedCount_idx" ON "CvSkillMatch"("professionId", "matchedCount")`,
  `CREATE INDEX IF NOT EXISTS "CvSkillMatch_cvId_matchedCount_idx" ON "CvSkillMatch"("cvId", "matchedCount")`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("sync-db-hardening: DATABASE_URL yo'q, o'tkazib yuborildi.");
    return;
  }
  const rawUrl = process.env.DATABASE_URL.trim();
  const sep = rawUrl.includes("?") ? "&" : "?";
  const dbUrl = rawUrl.includes("connect_timeout=")
    ? rawUrl
    : `${rawUrl}${sep}connect_timeout=25`;
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
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
