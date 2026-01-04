-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "emailTransactional" BOOLEAN NOT NULL DEFAULT true,
    "facebookId" TEXT,
    "instagramId" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accessToken", "accessTokenExpiry", "createdAt", "email", "emailSubscribed", "emailVerified", "facebookId", "id", "image", "instagramId", "name", "updatedAt") SELECT "accessToken", "accessTokenExpiry", "createdAt", "email", "emailSubscribed", "emailVerified", "facebookId", "id", "image", "instagramId", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
