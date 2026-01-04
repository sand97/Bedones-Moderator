/**
 * Subscription Utilities
 *
 * Helpers for managing subscriptions and checking user access with credit-based system
 */

import type { Subscription, SubscriptionTier } from '@prisma/client';

export interface PlanConfig {
  name: string;
  tier: SubscriptionTier;
  // Credit allocations (monthly refresh)
  monthlyModerationCredits: number; // 1 credit = 1 comment moderation
  monthlyFaqCredits: number; // Credits for FAQ auto-responses
  // Pricing
  price: {
    monthly: number; // Base price in USD cents (900 = $9)
    monthlyUsd: number; // Price in dollars for display
    monthlyXaf: number; // Price in FCFA for mobile money
    currency: 'USD' | 'XAF';
  };
  stripePriceId?: string; // Will be set from Stripe product IDs
  features: string[];
}

/**
 * Plan configurations for moderateur-bedones
 * New credit-based pricing: $9, $15, $25
 */
export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  FREE: {
    name: 'Free',
    tier: 'FREE',
    monthlyModerationCredits: 0, // Free users don't get monthly credits, only page trial credits
    monthlyFaqCredits: 0,
    price: {
      monthly: 0,
      monthlyUsd: 0,
      monthlyXaf: 0,
      currency: 'USD',
    },
    features: [
      'Free credits per new page',
      'Test the product risk-free',
      'Basic moderation features',
      'Community support',
    ],
  },
  STARTER: {
    name: 'Starter',
    tier: 'STARTER',
    monthlyModerationCredits: 1000, // 1,000 moderation credits
    monthlyFaqCredits: 100, // 100 FAQ auto-reply credits
    price: {
      monthly: 900, // $9 USD
      monthlyUsd: 9,
      monthlyXaf: 5400, // ~9 USD in FCFA (600 FCFA/USD)
      currency: 'USD',
    },
    features: [
      '1,000 moderation credits/month',
      '100 FAQ auto-reply credits/month',
      'AI-powered spam detection',
      'Undesired comment filtering',
      'Intelligent FAQ responses',
      'Priority email support',
    ],
  },
  PRO: {
    name: 'Pro',
    tier: 'PRO',
    monthlyModerationCredits: 5000, // 5,000 moderation credits
    monthlyFaqCredits: 500, // 500 FAQ auto-reply credits
    price: {
      monthly: 1500, // $15 USD
      monthlyUsd: 15,
      monthlyXaf: 9000, // ~15 USD in FCFA
      currency: 'USD',
    },
    features: [
      '5,000 moderation credits/month',
      '500 FAQ auto-reply credits/month',
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
    monthlyModerationCredits: 20000, // 20,000 moderation credits
    monthlyFaqCredits: 2000, // 2,000 FAQ auto-reply credits
    price: {
      monthly: 2500, // $25 USD
      monthlyUsd: 25,
      monthlyXaf: 15000, // ~25 USD in FCFA
      currency: 'USD',
    },
    features: [
      '20,000 moderation credits/month',
      '2,000 FAQ auto-reply credits/month',
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
 * Multi-month discount tiers for NotchPay (mobile money)
 * These discounts encourage longer-term commitments
 */
export const MULTI_MONTH_DISCOUNTS = {
  1: 0, // No discount for 1 month
  3: 5, // 5% discount for 3 months
  6: 10, // 10% discount for 6 months
  12: 20, // 20% discount for 12 months (1 year)
} as const;

/**
 * Free trial credits given to new pages (one-time per page)
 */
export const FREE_TRIAL_CREDITS = {
  moderationCredits: 100, // 100 free moderation credits per new page
  faqCredits: 10, // 10 free FAQ credits per new page
} as const;

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
 * Calculate price with multi-month discount
 */
export function calculateMultiMonthPrice(
  planKey: string,
  months: 1 | 3 | 6 | 12,
  currency: 'USD' | 'XAF' = 'XAF'
): {
  basePrice: number;
  totalBase: number;
  discount: number;
  discountAmount: number;
  finalPrice: number;
} {
  const plan = PLAN_CONFIGS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  const basePrice = currency === 'USD' ? plan.price.monthly : plan.price.monthlyXaf;
  const totalBase = basePrice * months;
  const discount = MULTI_MONTH_DISCOUNTS[months] || 0;
  const discountAmount = (totalBase * discount) / 100;
  const finalPrice = totalBase - discountAmount;

  return {
    basePrice,
    totalBase,
    discount,
    discountAmount,
    finalPrice,
  };
}

/**
 * Check if user can moderate more comments this month (DEPRECATED - use credit system)
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

  // LEGACY: Check monthly limit (deprecated)
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
