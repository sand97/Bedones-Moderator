/**
 * Subscription Utilities
 *
 * Helpers for managing subscriptions and checking user access
 */

import type { Subscription, SubscriptionTier } from '@prisma/client';

export interface PlanConfig {
  name: string;
  tier: SubscriptionTier;
  monthlyCommentLimit: number;
  price: {
    monthly: number; // in FCFA
    currency: 'XAF';
  };
  stripePriceId?: string; // Will be set from env
  features: string[];
}

/**
 * Plan configurations for moderateur-bedones
 * Pricing in FCFA (West/Central African Franc)
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  FREE: {
    name: 'Free',
    tier: 'FREE',
    monthlyCommentLimit: 100,
    price: {
      monthly: 0,
      currency: 'XAF',
    },
    features: [
      '100 comments moderated per month',
      'Basic spam detection',
      'Manual review dashboard',
      'Email support',
    ],
  },
  STARTER: {
    name: 'Starter',
    tier: 'STARTER',
    monthlyCommentLimit: 1000,
    price: {
      monthly: 5000, // 5,000 FCFA (~$8 USD)
      currency: 'XAF',
    },
    features: [
      '1,000 comments moderated per month',
      'AI-powered content detection',
      'Spam & hate speech detection',
      'Intelligent FAQ auto-replies',
      'Priority email support',
    ],
  },
  PRO: {
    name: 'Pro',
    tier: 'PRO',
    monthlyCommentLimit: 5000,
    price: {
      monthly: 20000, // 20,000 FCFA (~$32 USD)
      currency: 'XAF',
    },
    features: [
      '5,000 comments moderated per month',
      'Advanced AI moderation',
      'Multi-page support',
      'Custom moderation rules',
      'Analytics dashboard',
      'Priority support',
    ],
  },
  BUSINESS: {
    name: 'Business',
    tier: 'BUSINESS',
    monthlyCommentLimit: 20000,
    price: {
      monthly: 75000, // 75,000 FCFA (~$120 USD)
      currency: 'XAF',
    },
    features: [
      '20,000 comments moderated per month',
      'Enterprise AI moderation',
      'Unlimited pages',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
};

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(
  subscription: Subscription | null
): boolean {
  if (!subscription) return false;
  if (subscription.tier === 'FREE') return true;

  // Check if subscription has expired
  if (subscription.expiresAt && subscription.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if user can moderate more comments this month
 */
export function canModerateComment(
  subscription: Subscription | null
): { canModerate: boolean; reason?: string } {
  if (!subscription) {
    return {
      canModerate: false,
      reason: 'No subscription found. Please subscribe to continue.',
    };
  }

  // Check if subscription is active
  if (!hasActiveSubscription(subscription)) {
    return {
      canModerate: false,
      reason: 'Your subscription has expired. Please renew to continue.',
    };
  }

  // Check monthly limit
  if (subscription.currentMonthUsage >= subscription.monthlyCommentLimit) {
    return {
      canModerate: false,
      reason: `You've reached your monthly limit of ${subscription.monthlyCommentLimit} comments. Please upgrade your plan.`,
    };
  }

  return { canModerate: true };
}

/**
 * Get subscription status details
 */
export function getSubscriptionStatus(subscription: Subscription | null): {
  tier: SubscriptionTier;
  planName: string;
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  usagePercentage: number;
  commentsRemaining: number;
} {
  if (!subscription) {
    return {
      tier: 'FREE',
      planName: 'Free',
      isActive: true,
      expiresAt: null,
      daysRemaining: null,
      usagePercentage: 0,
      commentsRemaining: 100,
    };
  }

  const isActive = hasActiveSubscription(subscription);
  const daysRemaining = subscription.expiresAt
    ? Math.ceil(
        (subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const usagePercentage =
    (subscription.currentMonthUsage / subscription.monthlyCommentLimit) * 100;
  const commentsRemaining =
    subscription.monthlyCommentLimit - subscription.currentMonthUsage;

  return {
    tier: subscription.tier,
    planName: subscription.planName || PLAN_CONFIGS[subscription.tier].name,
    isActive,
    expiresAt: subscription.expiresAt,
    daysRemaining,
    usagePercentage,
    commentsRemaining,
  };
}

/**
 * Get plan config by tier
 */
export function getPlanConfig(tier: SubscriptionTier): PlanConfig {
  return PLAN_CONFIGS[tier];
}

/**
 * Check if usage should be reset (monthly)
 */
export function shouldResetUsage(subscription: Subscription): boolean {
  if (!subscription.usageResetDate) return true;

  const now = new Date();
  return now >= subscription.usageResetDate;
}

/**
 * Calculate next reset date (first day of next month)
 */
export function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}
