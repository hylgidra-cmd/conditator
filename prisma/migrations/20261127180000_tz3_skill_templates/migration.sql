-- Backend TZ 3: Kasblar uchun ko'nikma shablonlari (ProfessionSkillTemplate & CvSkillMatch)

ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SKILL_TEMPLATE_EDIT';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SKILL_TEMPLATE_IMPORT';

CREATE TABLE IF NOT EXISTS "ProfessionSkillTemplate" (
  "id" TEXT NOT NULL,
  "professionId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "nameUz" TEXT NOT NULL,
  "nameKk" TEXT NOT NULL,
  "nameRu" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "descriptionUz" TEXT NOT NULL,
  "descriptionKk" TEXT NOT NULL,
  "descriptionRu" TEXT NOT NULL,
  "descriptionEn" TEXT NOT NULL,
  "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfessionSkillTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CvSkillMatch" (
  "id" TEXT NOT NULL,
  "cvId" TEXT NOT NULL,
  "professionId" TEXT NOT NULL,
  "matchedCount" INTEGER NOT NULL DEFAULT 0,
  "matchedSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "missingSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "recalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CvSkillMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProfessionSkillTemplate_professionId_position_key" ON "ProfessionSkillTemplate"("professionId", "position");
CREATE INDEX IF NOT EXISTS "ProfessionSkillTemplate_professionId_isActive_position_idx" ON "ProfessionSkillTemplate"("professionId", "isActive", "position");

CREATE UNIQUE INDEX IF NOT EXISTS "CvSkillMatch_cvId_professionId_key" ON "CvSkillMatch"("cvId", "professionId");
CREATE INDEX IF NOT EXISTS "CvSkillMatch_professionId_matchedCount_idx" ON "CvSkillMatch"("professionId", "matchedCount");
CREATE INDEX IF NOT EXISTS "CvSkillMatch_cvId_matchedCount_idx" ON "CvSkillMatch"("cvId", "matchedCount");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfessionSkillTemplate_professionId_fkey') THEN
    ALTER TABLE "ProfessionSkillTemplate" ADD CONSTRAINT "ProfessionSkillTemplate_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProfessionSkillTemplate_updatedById_fkey') THEN
    ALTER TABLE "ProfessionSkillTemplate" ADD CONSTRAINT "ProfessionSkillTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CvSkillMatch_cvId_fkey') THEN
    ALTER TABLE "CvSkillMatch" ADD CONSTRAINT "CvSkillMatch_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CvSkillMatch_professionId_fkey') THEN
    ALTER TABLE "CvSkillMatch" ADD CONSTRAINT "CvSkillMatch_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
