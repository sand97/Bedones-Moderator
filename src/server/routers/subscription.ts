/**
 * Subscription and Payment tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../prisma';
import { PLAN_CONFIGS, calculateMultiMonthPrice } from '../../lib/subscription-utils';
import { getUserTotalCredits } from '../../lib/credit-utils';
import { TRPCError } from '@trpc/server';

export const subscriptionRouter = router({
  /**
   * Get current subscription details
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Get total credits across all user's pages
    const creditsInfo = await getUserTotalCredits(ctx.user.id);

    // Get plan config
    const planConfig = subscription
      ? PLAN_CONFIGS[subscription.tier]
      : PLAN_CONFIGS.FREE;

    return {
      subscription,
      planConfig,
      creditsInfo,
    };
  }),

  /**
   * Get all available plans with pricing
   */
  getPlans: protectedProcedure.query(async () => {
    return Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
    }));
  }),

  /**
   * Calculate price for multi-month purchase
   */
  calculatePrice: protectedProcedure
    .input(
      z.object({
        planKey: z.enum(['STARTER', 'PRO', 'BUSINESS']),
        months: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
        currency: z.enum(['USD', 'XAF']).default('XAF'),
      })
    )
    .query(async ({ input }) => {
      return calculateMultiMonthPrice(
        input.planKey,
        input.months,
        input.currency
      );
    }),

  /**
   * Get payment history
   */
  getPaymentHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(10),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 10, offset = 0 } = input || {};

      const subscription = await prisma.subscription.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!subscription) {
        return {
          payments: [],
          total: 0,
          hasMore: false,
        };
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { subscriptionId: subscription.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.payment.count({
          where: { subscriptionId: subscription.id },
        }),
      ]);

      return {
        payments,
        total,
        hasMore: offset + limit < total,
      };
    }),

  /**
   * Get subscription stats
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!subscription || subscription.tier === 'FREE') {
      return {
        totalSpent: 0,
        paymentsCount: 0,
        currentPlan: 'FREE',
        daysRemaining: null,
      };
    }

    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: subscription.id,
        status: 'COMPLETED',
      },
    });

    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    const daysRemaining = subscription.expiresAt
      ? Math.ceil(
          (subscription.expiresAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      totalSpent,
      paymentsCount: payments.length,
      currentPlan: subscription.tier,
      planName: subscription.planName || PLAN_CONFIGS[subscription.tier].name,
      daysRemaining,
      expiresAt: subscription.expiresAt,
      monthsPurchased: subscription.monthsPurchased,
    };
  }),

  /**
   * Cancel subscription (downgrade to FREE)
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No subscription found',
      });
    }

    if (subscription.tier === 'FREE') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Already on FREE plan',
      });
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      // TODO: Call Stripe API to cancel subscription
      console.warn(
        'Stripe subscription cancellation not implemented:',
        subscription.stripeSubscriptionId
      );
    }

    // Downgrade to FREE
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        tier: 'FREE',
        planName: 'Free',
        monthlyModerationCredits: 0,
        monthlyFaqCredits: 0,
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeProductId: null,
        expiresAt: null,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }),
});
