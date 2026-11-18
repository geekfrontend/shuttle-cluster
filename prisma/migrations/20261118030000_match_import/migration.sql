-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "tier" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "matches_external_id_key" ON "matches"("external_id");

