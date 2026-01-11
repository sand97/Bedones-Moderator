/**
 * Credit Management Utilities
 *
 * Manage user-level credits for moderation and FAQ auto-responses
 */

import { prisma } from '../server/prisma';
import { FREE_TRIAL_CREDITS, PLAN_CONFIGS } from './subscription-utils';
import type { UserCredits, Subscription } from '@prisma/client';

export type CreditType = 'moderation' | 'faq';

/**
 * Get or create UserCredits for a user
 */
export async function getOrCreateUserCredits(
  userId: string
): Promise<UserCredits> {
  let userCredits = await prisma.userCredits.findUnique({
    where: { userId },
  });

  if (!userCredits) {
    // Create new UserCredits entry for this user
    userCredits = await prisma.userCredits.create({
      data: {
        userId,
        moderationCredits: 0,
        faqCredits: 0,
        totalModerationsUsed: 0,
        totalFaqRepliesUsed: 0,
        unmoderatdComments: 0,
      },
    });
  }

  return userCredits;
}

/**
 * Grant initial credits to a FREE user (one-time on signup)
 */
export async function grantInitialCredits(
  userId: string
): Promise<{ granted: boolean; credits: UserCredits }> {
  const userCredits = await getOrCreateUserCredits(userId);

  // Check if user already has credits (avoid double-granting)
  if (userCredits.moderationCredits > 0 || userCredits.faqCredits > 0) {
    return { granted: false, credits: userCredits };
  }

  // Grant initial free credits
  const updatedCredits = await prisma.userCredits.update({
    where: { userId },
    data: {
      moderationCredits: FREE_TRIAL_CREDITS.moderationCredits,
      faqCredits: FREE_TRIAL_CREDITS.faqCredits,
    },
  });

  return { granted: true, credits: updatedCredits };
}

/**
 * Check if a user has enough credits for an operation
 */
export async function hasCredits(
  userId: string,
  type: CreditType,
  amount = 1
): Promise<{ hasCredits: boolean; available: number; reason?: string }> {
  const userCredits = await getOrCreateUserCredits(userId);

  const availableCredits =
    type === 'moderation'
      ? userCredits.moderationCredits
      : userCredits.faqCredits;

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
 * Deduct credits from a user (with transaction safety)
 */
export async function deductCredits(
  userId: string,
  type: CreditType,
  amount = 1
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const check = await hasCredits(userId, type, amount);

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

    const updated = await prisma.userCredits.update({
      where: { userId },
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
 * Add credits to a user (for purchases or refills)
 */
export async function addCredits(
  userId: string,
  moderationCredits = 0,
  faqCredits = 0
): Promise<UserCredits> {
  await getOrCreateUserCredits(userId);

  return prisma.userCredits.update({
    where: { userId },
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
 * Refill monthly credits for user (called on subscription renewal)
 */
export async function refillMonthlyCredits(
  userId: string,
  subscription: Subscription
): Promise<{ creditsAdded: number }> {
  // Get plan configuration
  const planConfig = PLAN_CONFIGS[subscription.tier];

  if (!planConfig || subscription.tier === 'FREE') {
    return { creditsAdded: 0 };
  }

  // Refill credits
  await addCredits(
    userId,
    planConfig.monthlyModerationCredits,
    planConfig.monthlyFaqCredits
  );

  const creditsAdded =
    planConfig.monthlyModerationCredits + planConfig.monthlyFaqCredits;

  return { creditsAdded };
}

/**
 * Get credit balance for a user
 */
export async function getCreditBalance(userId: string): Promise<{
  moderationCredits: number;
  faqCredits: number;
  totalModerationsUsed: number;
  totalFaqRepliesUsed: number;
  unmoderatdComments: number;
}> {
  const userCredits = await getOrCreateUserCredits(userId);

  return {
    moderationCredits: userCredits.moderationCredits,
    faqCredits: userCredits.faqCredits,
    totalModerationsUsed: userCredits.totalModerationsUsed,
    totalFaqRepliesUsed: userCredits.totalFaqRepliesUsed,
    unmoderatdComments: userCredits.unmoderatdComments,
  };
}

/**
 * Increment unmoderated comments counter
 */
export async function incrementUnmoderatedComments(
  userId: string
): Promise<void> {
  await getOrCreateUserCredits(userId);

  await prisma.userCredits.update({
    where: { userId },
    data: {
      unmoderatdComments: {
        increment: 1,
      },
    },
  });
}
