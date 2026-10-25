-- CreateTable
CREATE TABLE "CvView" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pdf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CvView_companyId_createdAt_idx" ON "CvView"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CvView_cvId_idx" ON "CvView"("cvId");

-- AddForeignKey
ALTER TABLE "CvView" ADD CONSTRAINT "CvView_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvView" ADD CONSTRAINT "CvView_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
