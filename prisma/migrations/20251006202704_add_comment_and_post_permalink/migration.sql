-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "permalinkUrl" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "permalinkUrl" TEXT;

-- CreateIndex
CREATE INDEX "Comment_createdTime_idx" ON "Comment"("createdTime");
