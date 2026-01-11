/**
 * Usage and Credits tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../prisma';
import { getCreditBalance } from '../../lib/credit-utils';

export const usageRouter = router({
  /**
   * Get overall usage summary
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    // Get user credits
    const creditsInfo = await getCreditBalance(ctx.user.id);

    // Get all pages
    const pages = await prisma.page.findMany({
      where: { userId: ctx.user.id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // Get usage tracking data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageTracking = await prisma.usageTracking.findMany({
      where: {
        userId: ctx.user.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate total usage
    const totalCommentsAnalyzed = usageTracking.reduce(
      (sum, u) => sum + u.commentsAnalyzed,
      0
    );

    const totalCost = usageTracking.reduce(
      (sum, u) => sum + u.estimatedCost,
      0
    );

    return {
      subscription,
      creditsInfo,
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        provider: page.provider,
        postsCount: page._count.posts,
      })),
      usageStats: {
        totalCommentsAnalyzed,
        totalCost,
        last30Days: usageTracking.length,
      },
    };
  }),

  /**
   * Get credit balance for the user
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    return getCreditBalance(ctx.user.id);
  }),

  /**
   * Get usage history with daily breakdown
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const usageHistory = await prisma.usageTracking.findMany({
        where: {
          userId: ctx.user.id,
          date: {
            gte: startDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      return usageHistory;
    }),

  /**
   * Get usage by platform (Facebook vs Instagram)
   */
  getByPlatform: protectedProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageData = await prisma.usageTracking.findMany({
      where: {
        userId: ctx.user.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const facebookTotal = usageData.reduce(
      (sum, u) => sum + u.facebookComments,
      0
    );
    const instagramTotal = usageData.reduce(
      (sum, u) => sum + u.instagramComments,
      0
    );

    return {
      facebook: facebookTotal,
      instagram: instagramTotal,
      total: facebookTotal + instagramTotal,
    };
  }),

  /**
   * Get current period usage (for subscription limit tracking)
   */
  getCurrentPeriod: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!subscription) {
      return {
        usageResetDate: null,
        currentMonthUsage: 0,
        monthlyLimit: 0,
        usagePercentage: 0,
        remaining: 0,
      };
    }

    const usagePercentage = subscription.monthlyCommentLimit
      ? (subscription.currentMonthUsage / subscription.monthlyCommentLimit) *
        100
      : 0;

    const remaining = Math.max(
      0,
      subscription.monthlyCommentLimit - subscription.currentMonthUsage
    );

    return {
      usageResetDate: subscription.usageResetDate,
      currentMonthUsage: subscription.currentMonthUsage,
      monthlyLimit: subscription.monthlyCommentLimit,
      monthlyModerationCredits: subscription.monthlyModerationCredits,
      monthlyFaqCredits: subscription.monthlyFaqCredits,
      usagePercentage,
      remaining,
    };
  }),

  /**
   * Get top pages by post count
   */
  getTopPages: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const pages = await prisma.page.findMany({
        where: { userId: ctx.user.id },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      // Get user credits for total usage
      const userCredits = await getCreditBalance(ctx.user.id);

      // Sort by post count (as proxy for activity)
      const sortedPages = pages
        .map((page) => ({
          id: page.id,
          name: page.name,
          provider: page.provider,
          profilePictureUrl: page.profilePictureUrl,
          totalUsage: userCredits.totalModerationsUsed + userCredits.totalFaqRepliesUsed,
          moderationUsage: userCredits.totalModerationsUsed,
          faqUsage: userCredits.totalFaqRepliesUsed,
          postsCount: page._count.posts,
        }))
        .sort((a, b) => b.postsCount - a.postsCount)
        .slice(0, input.limit);

      return sortedPages;
    }),
});
