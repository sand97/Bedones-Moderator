-- AlterTable
ALTER TABLE "User" ADD COLUMN "instagramId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");
