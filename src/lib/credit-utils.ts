/**
 * Credit Management Utilities
 *
 * Manage page-level credits for moderation and FAQ auto-responses
 */

import { prisma } from '@/server/prisma';
import { FREE_TRIAL_CREDITS, PLAN_CONFIGS } from './subscription-utils';
import type { PageCredits, Subscription } from '@prisma/client';

export type CreditType = 'moderation' | 'faq';

/**
 * Get or create PageCredits for a page
 */
export async function getOrCreatePageCredits(
  pageId: string
): Promise<PageCredits> {
  let pageCredits = await prisma.pageCredits.findUnique({
    where: { pageId },
  });

  if (!pageCredits) {
    // Create new PageCredits entry for this page
    pageCredits = await prisma.pageCredits.create({
      data: {
        pageId,
        moderationCredits: 0,
        faqCredits: 0,
        freeCreditsGiven: false,
        freeCreditsAmount: 0,
      },
    });
  }

  return pageCredits;
}

/**
 * Grant free trial credits to a new page (one-time only)
 */
export async function grantFreeTrialCredits(
  pageId: string
): Promise<{ granted: boolean; credits: PageCredits }> {
  const pageCredits = await getOrCreatePageCredits(pageId);

  // Check if free credits were already given
  if (pageCredits.freeCreditsGiven) {
    return { granted: false, credits: pageCredits };
  }

  // Grant free credits
  const updatedCredits = await prisma.pageCredits.update({
    where: { pageId },
    data: {
      moderationCredits: {
        increment: FREE_TRIAL_CREDITS.moderationCredits,
      },
      faqCredits: {
        increment: FREE_TRIAL_CREDITS.faqCredits,
      },
      freeCreditsGiven: true,
      freeCreditsAmount:
        FREE_TRIAL_CREDITS.moderationCredits + FREE_TRIAL_CREDITS.faqCredits,
    },
  });

  return { granted: true, credits: updatedCredits };
}

/**
 * Check if a page has enough credits for an operation
 */
export async function hasCredits(
  pageId: string,
  type: CreditType,
  amount = 1
): Promise<{ hasCredits: boolean; available: number; reason?: string }> {
  const pageCredits = await getOrCreatePageCredits(pageId);

  const availableCredits =
    type === 'moderation'
      ? pageCredits.moderationCredits
      : pageCredits.faqCredits;

  if (availableCredits >= amount) {
    return {
      hasCredits: true,
      available: availableCredits,
    };
  }

  return {
    hasCredits: false,
    available: availableCredits,
    reason: `Insufficient ${type} credits. You need ${amount} but only have ${availableCredits}. Please purchase more credits or upgrade your plan.`,
  };
}

/**
 * Deduct credits from a page (with transaction safety)
 */
export async function deductCredits(
  pageId: string,
  type: CreditType,
  amount = 1
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const check = await hasCredits(pageId, type, amount);

    if (!check.hasCredits) {
      return {
        success: false,
        remaining: check.available,
        error: check.reason,
      };
    }

    // Deduct credits atomically
    const field =
      type === 'moderation' ? 'moderationCredits' : 'faqCredits';
    const usageField =
      type === 'moderation'
        ? 'totalModerationsUsed'
        : 'totalFaqRepliesUsed';

    const updated = await prisma.pageCredits.update({
      where: { pageId },
      data: {
        [field]: {
          decrement: amount,
        },
        [usageField]: {
          increment: amount,
        },
      },
    });

    const remaining =
      type === 'moderation' ? updated.moderationCredits : updated.faqCredits;

    return {
      success: true,
      remaining,
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      remaining: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add credits to a page (for purchases or refills)
 */
export async function addCredits(
  pageId: string,
  moderationCredits = 0,
  faqCredits = 0
): Promise<PageCredits> {
  await getOrCreatePageCredits(pageId);

  return prisma.pageCredits.update({
    where: { pageId },
    data: {
      moderationCredits: {
        increment: moderationCredits,
      },
      faqCredits: {
        increment: faqCredits,
      },
    },
  });
}

/**
 * Refill monthly credits for all user's pages (called on subscription renewal)
 */
export async function refillMonthlyCredits(
  userId: string,
  subscription: Subscription
): Promise<{ pagesRefilled: number; totalCreditsAdded: number }> {
  // Get plan configuration
  const planConfig = PLAN_CONFIGS[subscription.tier];

  if (!planConfig || subscription.tier === 'FREE') {
    return { pagesRefilled: 0, totalCreditsAdded: 0 };
  }

  // Get all user's pages
  const pages = await prisma.page.findMany({
    where: { userId },
    select: { id: true },
  });

  let pagesRefilled = 0;
  let totalCreditsAdded = 0;

  // Refill credits for each page
  for (const page of pages) {
    await addCredits(
      page.id,
      planConfig.monthlyModerationCredits,
      planConfig.monthlyFaqCredits
    );

    pagesRefilled++;
    totalCreditsAdded +=
      planConfig.monthlyModerationCredits + planConfig.monthlyFaqCredits;
  }

  return { pagesRefilled, totalCreditsAdded };
}

/**
 * Get credit balance for a page
 */
export async function getCreditBalance(pageId: string): Promise<{
  moderationCredits: number;
  faqCredits: number;
  totalModerationsUsed: number;
  totalFaqRepliesUsed: number;
  freeCreditsGiven: boolean;
}> {
  const pageCredits = await getOrCreatePageCredits(pageId);

  return {
    moderationCredits: pageCredits.moderationCredits,
    faqCredits: pageCredits.faqCredits,
    totalModerationsUsed: pageCredits.totalModerationsUsed,
    totalFaqRepliesUsed: pageCredits.totalFaqRepliesUsed,
    freeCreditsGiven: pageCredits.freeCreditsGiven,
  };
}

/**
 * Get total credits across all user's pages
 */
export async function getUserTotalCredits(userId: string): Promise<{
  totalModerationCredits: number;
  totalFaqCredits: number;
  pageCount: number;
}> {
  const pages = await prisma.page.findMany({
    where: { userId },
    include: { credits: true },
  });

  let totalModerationCredits = 0;
  let totalFaqCredits = 0;

  for (const page of pages) {
    if (page.credits) {
      totalModerationCredits += page.credits.moderationCredits;
      totalFaqCredits += page.credits.faqCredits;
    }
  }

  return {
    totalModerationCredits,
    totalFaqCredits,
    pageCount: pages.length,
  };
}
