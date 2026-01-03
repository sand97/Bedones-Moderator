-- CreateTable
CREATE TABLE "PageCredits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "moderationCredits" INTEGER NOT NULL DEFAULT 0,
    "faqCredits" INTEGER NOT NULL DEFAULT 0,
    "freeCreditsGiven" BOOLEAN NOT NULL DEFAULT false,
    "freeCreditsAmount" INTEGER NOT NULL DEFAULT 0,
    "totalModerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "totalFaqRepliesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PageCredits_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProvider" TEXT NOT NULL,
    "monthsPurchased" INTEGER NOT NULL DEFAULT 1,
    "discountPercentage" REAL NOT NULL DEFAULT 0,
    "baseAmount" REAL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "notchpayTransactionId" TEXT,
    "notchpayReference" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "currency", "id", "metadata", "notchpayReference", "notchpayTransactionId", "paymentProvider", "status", "stripeChargeId", "stripePaymentIntentId", "subscriptionId", "updatedAt") SELECT "amount", "createdAt", "currency", "id", "metadata", "notchpayReference", "notchpayTransactionId", "paymentProvider", "status", "stripeChargeId", "stripePaymentIntentId", "subscriptionId", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_stripePaymentIntentId_idx" ON "Payment"("stripePaymentIntentId");
CREATE INDEX "Payment_notchpayTransactionId_idx" ON "Payment"("notchpayTransactionId");
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "planName" TEXT,
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "notchpayCustomerEmail" TEXT,
    "notchpayCustomerPhone" TEXT,
    "monthlyModerationCredits" INTEGER NOT NULL DEFAULT 0,
    "monthlyFaqCredits" INTEGER NOT NULL DEFAULT 0,
    "monthlyCommentLimit" INTEGER NOT NULL DEFAULT 100,
    "currentMonthUsage" INTEGER NOT NULL DEFAULT 0,
    "monthsPurchased" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "usageResetDate" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("createdAt", "currentMonthUsage", "expiresAt", "id", "monthlyCommentLimit", "notchpayCustomerEmail", "notchpayCustomerPhone", "planName", "stripeCustomerId", "stripePriceId", "stripeProductId", "stripeSubscriptionId", "tier", "updatedAt", "usageResetDate", "userId") SELECT "createdAt", "currentMonthUsage", "expiresAt", "id", "monthlyCommentLimit", "notchpayCustomerEmail", "notchpayCustomerPhone", "planName", "stripeCustomerId", "stripePriceId", "stripeProductId", "stripeSubscriptionId", "tier", "updatedAt", "usageResetDate", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_tier_idx" ON "Subscription"("tier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PageCredits_pageId_key" ON "PageCredits"("pageId");

-- CreateIndex
CREATE INDEX "PageCredits_pageId_idx" ON "PageCredits"("pageId");
