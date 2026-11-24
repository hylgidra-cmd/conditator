-- CreateEnum
CREATE TYPE "PersonalityQuestionType" AS ENUM ('STATEMENT', 'CHOICE');

-- CreateEnum
CREATE TYPE "PersonalityAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "PersonalityAnswer" ADD COLUMN     "attemptId" TEXT,
ADD COLUMN     "choice" TEXT;

-- AlterTable
ALTER TABLE "PersonalityQuestion" ADD COLUMN     "optionAEn" TEXT,
ADD COLUMN     "optionAKk" TEXT,
ADD COLUMN     "optionARu" TEXT,
ADD COLUMN     "optionAUz" TEXT,
ADD COLUMN     "optionBEn" TEXT,
ADD COLUMN     "optionBKk" TEXT,
ADD COLUMN     "optionBRu" TEXT,
ADD COLUMN     "optionBUz" TEXT,
ADD COLUMN     "type" "PersonalityQuestionType" NOT NULL DEFAULT 'STATEMENT';

-- AlterTable
ALTER TABLE "PersonalityResult" ADD COLUMN     "attemptId" TEXT;

-- AlterTable
ALTER TABLE "PersonalityType" ADD COLUMN     "strengthsEn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "strengthsKk" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "strengthsRu" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "strengthsUz" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN     "professionId" TEXT,
ADD COLUMN     "wantedGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "wantedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PersonalityAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionIds" TEXT[],
    "answers" JSONB NOT NULL DEFAULT '{}',
    "status" "PersonalityAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionTypeSuggestion" (
    "professionId" TEXT NOT NULL,
    "typeCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionTypeSuggestion_pkey" PRIMARY KEY ("professionId")
);

-- CreateTable
CREATE TABLE "CompanyStatsSnapshot" (
    "id" TEXT NOT NULL DEFAULT 'latest',
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyStatsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTypeTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wantedTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wantedGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTypeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalityAttempt_userId_status_startedAt_idx" ON "PersonalityAttempt"("userId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "PersonalityAttempt_userId_startedAt_idx" ON "PersonalityAttempt"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "CompanyTypeTemplate_companyId_createdAt_idx" ON "CompanyTypeTemplate"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonalityQuestion_scale_type_isActive_idx" ON "PersonalityQuestion"("scale", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityResult_attemptId_key" ON "PersonalityResult"("attemptId");

-- AddForeignKey
ALTER TABLE "PersonalityAttempt" ADD CONSTRAINT "PersonalityAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityResult" ADD CONSTRAINT "PersonalityResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PersonalityAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionTypeSuggestion" ADD CONSTRAINT "ProfessionTypeSuggestion_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTypeTemplate" ADD CONSTRAINT "CompanyTypeTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
