/*
  Warnings:

  - You are about to drop the `PageCredits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PageCredits";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UserCredits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moderationCredits" INTEGER NOT NULL DEFAULT 0,
    "faqCredits" INTEGER NOT NULL DEFAULT 0,
    "totalModerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "totalFaqRepliesUsed" INTEGER NOT NULL DEFAULT 0,
    "unmoderatdComments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCredits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCredits_userId_key" ON "UserCredits"("userId");

-- CreateIndex
CREATE INDEX "UserCredits_userId_idx" ON "UserCredits"("userId");
