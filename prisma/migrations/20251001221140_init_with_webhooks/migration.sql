/*
  Warnings:

  - You are about to drop the `Author` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `aiResponse` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `moderationStatus` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `moderationType` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Post` table. All the data in the column will be lost.
  - Added the required column `action` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromName` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Author";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "createdTime" DATETIME NOT NULL,
    "action" TEXT NOT NULL,
    "actionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("createdAt", "createdTime", "id", "message", "pageId", "updatedAt") SELECT "createdAt", "createdTime", "id", "message", "pageId", "updatedAt" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX "Comment_pageId_idx" ON "Comment"("pageId");
CREATE INDEX "Comment_fromId_idx" ON "Comment"("fromId");
CREATE INDEX "Comment_action_idx" ON "Comment"("action");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_pageId_idx" ON "Post"("pageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
