-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedVacancy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SavedVacancy_userId_vacancyId_key" ON "SavedVacancy"("userId", "vacancyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedVacancy_userId_createdAt_idx" ON "SavedVacancy"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedVacancy_vacancyId_idx" ON "SavedVacancy"("vacancyId");

-- AddForeignKey
ALTER TABLE "SavedVacancy" ADD CONSTRAINT "SavedVacancy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVacancy" ADD CONSTRAINT "SavedVacancy_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
