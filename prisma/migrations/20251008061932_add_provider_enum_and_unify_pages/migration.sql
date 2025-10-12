-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL DEFAULT 'FACEBOOK',
    "name" TEXT NOT NULL,
    "username" TEXT,
    "profilePictureUrl" TEXT,
    "followersCount" INTEGER,
    "accessToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Page" ("accessToken", "createdAt", "id", "name", "updatedAt", "userId") SELECT "accessToken", "createdAt", "id", "name", "updatedAt", "userId" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE INDEX "Page_userId_idx" ON "Page"("userId");
CREATE INDEX "Page_provider_idx" ON "Page"("provider");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
