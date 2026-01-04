/**
 * Usage and Credits tRPC Router
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '../prisma';
import { getCreditBalance, getUserTotalCredits } from '../../lib/credit-utils';

export const usageRouter = router({
  /**
   * Get overall usage summary
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    });

    // Get total credits across all pages
    const creditsInfo = await getUserTotalCredits(ctx.user.id);

    // Get all pages
    const pages = await prisma.page.findMany({
      where: { userId: ctx.user.id },
      include: {
        credits: true,
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
        moderationCredits: page.credits?.moderationCredits || 0,
        faqCredits: page.credits?.faqCredits || 0,
        totalModerationsUsed: page.credits?.totalModerationsUsed || 0,
        totalFaqRepliesUsed: page.credits?.totalFaqRepliesUsed || 0,
        freeCreditsGiven: page.credits?.freeCreditsGiven || false,
      })),
      usageStats: {
        totalCommentsAnalyzed,
        totalCost,
        last30Days: usageTracking.length,
      },
    };
  }),

  /**
   * Get credit balance for a specific page
   */
  getPageCredits: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify page ownership
      const page = await prisma.page.findUnique({
        where: { id: input.pageId },
      });

      if (page?.userId !== ctx.user.id) {
        throw new Error('Page not found or unauthorized');
      }

      return getCreditBalance(input.pageId);
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
   * Get top pages by usage
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
          credits: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      // Sort by total usage (moderation + FAQ)
      const sortedPages = pages
        .map((page) => ({
          id: page.id,
          name: page.name,
          provider: page.provider,
          profilePictureUrl: page.profilePictureUrl,
          totalUsage:
            (page.credits?.totalModerationsUsed || 0) +
            (page.credits?.totalFaqRepliesUsed || 0),
          moderationUsage: page.credits?.totalModerationsUsed || 0,
          faqUsage: page.credits?.totalFaqRepliesUsed || 0,
          postsCount: page._count.posts,
        }))
        .sort((a, b) => b.totalUsage - a.totalUsage)
        .slice(0, input.limit);

      return sortedPages;
    }),
});
