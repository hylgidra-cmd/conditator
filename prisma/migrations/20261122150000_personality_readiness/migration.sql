-- CreateEnum
CREATE TYPE "PersonalityScale" AS ENUM ('MIND', 'ENERGY', 'NATURE', 'TACTICS', 'IDENTITY');

-- CreateEnum
CREATE TYPE "ProfessionSource" AS ENUM ('AUTO', 'ADMIN', 'STUDENT', 'ADMIN_EXCLUDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAction" ADD VALUE 'PERSONALITY_INVALIDATE';
ALTER TYPE "AdminAction" ADD VALUE 'PERSONALITY_QUESTION_EDIT';
ALTER TYPE "AdminAction" ADD VALUE 'PERSONALITY_TYPE_EDIT';
ALTER TYPE "AdminAction" ADD VALUE 'PERSONALITY_SETTING_EDIT';
ALTER TYPE "AdminAction" ADD VALUE 'PROFESSION_EDIT';
ALTER TYPE "AdminAction" ADD VALUE 'USER_PROFESSION_EDIT';

-- CreateTable
CREATE TABLE "PersonalityQuestion" (
    "id" TEXT NOT NULL,
    "scale" "PersonalityScale" NOT NULL,
    "direction" INTEGER NOT NULL,
    "textKk" TEXT NOT NULL,
    "textUz" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PersonalityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityDraft" (
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalityDraft_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PersonalityResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "mindPct" INTEGER NOT NULL,
    "energyPct" INTEGER NOT NULL,
    "naturePct" INTEGER NOT NULL,
    "tacticsPct" INTEGER NOT NULL,
    "identityPct" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,

    CONSTRAINT "PersonalityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalityAnswer" (
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "PersonalityAnswer_pkey" PRIMARY KEY ("resultId","questionId")
);

-- CreateTable
CREATE TABLE "PersonalityType" (
    "code" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "titleKk" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionKk" TEXT NOT NULL,
    "descriptionUz" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,

    CONSTRAINT "PersonalityType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "nameKk" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "keywords" TEXT[],
    "educationFields" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfession" (
    "userId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "source" "ProfessionSource" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "UserProfession_pkey" PRIMARY KEY ("userId","professionId")
);

-- CreateTable
CREATE TABLE "UserLanguage" (
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "UserLanguage_pkey" PRIMARY KEY ("userId","language")
);

-- CreateTable
CREATE TABLE "ReadinessProfile" (
    "userId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "personalityGroup" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "languageBand" TEXT NOT NULL,
    "experienceBand" TEXT NOT NULL,
    "hasInternship" BOOLEAN NOT NULL DEFAULT false,
    "readinessScore" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessProfile_pkey" PRIMARY KEY ("userId","professionId")
);

-- CreateIndex
CREATE INDEX "PersonalityQuestion_version_isActive_sort_idx" ON "PersonalityQuestion"("version", "isActive", "sort");

-- CreateIndex
CREATE INDEX "PersonalityResult_userId_archivedAt_createdAt_idx" ON "PersonalityResult"("userId", "archivedAt", "createdAt");

-- Only one current result can exist per student, including concurrent submissions.
CREATE UNIQUE INDEX "PersonalityResult_one_active_per_user" ON "PersonalityResult"("userId") WHERE "archivedAt" IS NULL AND "invalidatedAt" IS NULL;

ALTER TABLE "PersonalityAnswer" ADD CONSTRAINT "PersonalityAnswer_value_range" CHECK ("value" BETWEEN -3 AND 3);
ALTER TABLE "PersonalityQuestion" ADD CONSTRAINT "PersonalityQuestion_direction_range" CHECK ("direction" IN (-1, 1));

-- CreateIndex
CREATE INDEX "Profession_parentId_isActive_sort_idx" ON "Profession"("parentId", "isActive", "sort");

-- CreateIndex
CREATE INDEX "ReadinessProfile_professionId_personalityGroup_typeCode_idx" ON "ReadinessProfile"("professionId", "personalityGroup", "typeCode");

-- CreateIndex
CREATE INDEX "ReadinessProfile_languageBand_experienceBand_idx" ON "ReadinessProfile"("languageBand", "experienceBand");

-- AddForeignKey
ALTER TABLE "PersonalityDraft" ADD CONSTRAINT "PersonalityDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityResult" ADD CONSTRAINT "PersonalityResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityAnswer" ADD CONSTRAINT "PersonalityAnswer_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "PersonalityResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalityAnswer" ADD CONSTRAINT "PersonalityAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PersonalityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profession" ADD CONSTRAINT "Profession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Profession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfession" ADD CONSTRAINT "UserProfession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfession" ADD CONSTRAINT "UserProfession_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLanguage" ADD CONSTRAINT "UserLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessProfile" ADD CONSTRAINT "ReadinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessProfile" ADD CONSTRAINT "ReadinessProfile_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
