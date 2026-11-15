-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "startLocationId" TEXT;

-- AlterTable
ALTER TABLE "npcs" ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "evidences" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "queries" ADD COLUMN     "answerValues" TEXT[],
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "hint" TEXT,
ADD COLUMN     "maxRows" INTEGER,
ADD COLUMN     "question" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "unlockMessage" TEXT;

-- AlterTable
ALTER TABLE "investigation_tables" ADD COLUMN     "description" TEXT,
ADD COLUMN     "displayName" TEXT;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_startLocationId_fkey" FOREIGN KEY ("startLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

