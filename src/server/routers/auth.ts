import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { FacebookService } from '../services/facebook';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  /**
   * Get current user session
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),

  /**
   * Get dashboard statistics for the current user
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Count connected Facebook pages
    const connectedPagesCount = await ctx.db.page.count({
      where: { userId },
    });

    // Count moderated comments (hidden or deleted)
    const moderatedCommentsCount = await ctx.db.comment.count({
      where: {
        action: {
          in: ['hide', 'delete'],
        },
        post: {
          page: {
            userId,
          },
        },
      },
    });

    return {
      connectedPagesCount,
      moderatedCommentsCount,
    };
  }),

  /**
   * Fetch and save user's Facebook pages after OAuth
   */
  syncFacebookPages: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Fetch pages from Facebook
        const pages = await FacebookService.fetchUserPages(input.accessToken);

        // Save pages to database
        await FacebookService.saveUserPages(userId, input.accessToken, pages);

        return {
          success: true,
          pagesCount: pages.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync Facebook pages',
          cause: error,
        });
      }
    }),

  /**
   * Auto-sync Facebook pages using stored access token
   */
  autoSyncFacebookPages: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      // Get Facebook account with access token
      const facebookAccount = await ctx.db.account.findFirst({
        where: {
          userId,
          providerId: 'facebook',
        },
      });

      if (!facebookAccount || !facebookAccount.accessToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Facebook account or access token not found',
        });
      }

      // Fetch pages from Facebook
      const pages = await FacebookService.fetchUserPages(
        facebookAccount.accessToken,
      );

      // Save pages to database
      await FacebookService.saveUserPages(
        userId,
        facebookAccount.accessToken,
        pages,
      );

      return {
        success: true,
        pagesCount: pages.length,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync Facebook pages',
        cause: error,
      });
    }
  }),

  /**
   * Get user's connected pages
   */
  getPages: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const pages = await ctx.db.page.findMany({
      where: { userId },
      include: {
        settings: {
          include: {
            faqRules: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pages;
  }),

  /**
   * Get pages count by provider
   */
  getPagesCountByProvider: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Currently only Facebook pages are supported
    const facebookPagesCount = await ctx.db.page.count({
      where: { userId },
    });

    return {
      facebook: facebookPagesCount,
      instagram: 0,
      tiktok: 0,
    };
  }),

  /**
   * Apply initial settings to all user pages
   */
  applyInitialSettingsToPages: protectedProcedure
    .input(
      z.object({
        undesiredCommentsEnabled: z.boolean(),
        undesiredCommentsAction: z.enum(['hide', 'delete']),
        spamDetectionEnabled: z.boolean(),
        spamAction: z.enum(['hide', 'delete']),
        intelligentFAQEnabled: z.boolean(),
        faqItems: z.array(
          z.object({
            assertion: z.string(),
            response: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get all user pages
      const pages = await ctx.db.page.findMany({
        where: { userId },
      });

      if (pages.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No pages found',
        });
      }

      // Update settings for all pages
      for (const page of pages) {
        // Upsert page settings
        const pageSettings = await ctx.db.pageSettings.upsert({
          where: { pageId: page.id },
          create: {
            pageId: page.id,
            undesiredCommentsEnabled: input.undesiredCommentsEnabled,
            undesiredCommentsAction: input.undesiredCommentsAction,
            spamDetectionEnabled: input.spamDetectionEnabled,
            spamAction: input.spamAction,
            intelligentFAQEnabled: input.intelligentFAQEnabled,
          },
          update: {
            undesiredCommentsEnabled: input.undesiredCommentsEnabled,
            undesiredCommentsAction: input.undesiredCommentsAction,
            spamDetectionEnabled: input.spamDetectionEnabled,
            spamAction: input.spamAction,
            intelligentFAQEnabled: input.intelligentFAQEnabled,
          },
        });

        // Create FAQ rules if intelligentFAQ is enabled
        if (input.intelligentFAQEnabled && input.faqItems.length > 0) {
          for (const faqItem of input.faqItems) {
            await ctx.db.fAQRule.create({
              data: {
                pageSettingsId: pageSettings.id,
                assertion: faqItem.assertion,
                response: faqItem.response,
              },
            });
          }
        }
      }

      return {
        success: true,
        pagesUpdated: pages.length,
      };
    }),

  /**
   * Update page settings
   */
  updatePageSettings: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        undesiredCommentsEnabled: z.boolean().optional(),
        undesiredCommentsAction: z.enum(['hide', 'delete']).optional(),
        spamDetectionEnabled: z.boolean().optional(),
        spamAction: z.enum(['hide', 'delete']).optional(),
        intelligentFAQEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { pageId, ...settings } = input;

      // Verify page belongs to user
      const page = await ctx.db.page.findFirst({
        where: {
          id: pageId,
          userId: ctx.user.id,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Page not found or access denied',
        });
      }

      // Update settings
      const pageSettings = await ctx.db.pageSettings.upsert({
        where: { pageId },
        create: {
          pageId,
          ...settings,
        },
        update: settings,
      });

      return pageSettings;
    }),

  /**
   * Add FAQ rule to a page
   */
  addFAQRule: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        assertion: z.string().min(3),
        response: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify page belongs to user
      const page = await ctx.db.page.findFirst({
        where: {
          id: input.pageId,
          userId: ctx.user.id,
        },
      });

      if (!page) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Page not found or access denied',
        });
      }

      // Get or create page settings
      let pageSettings = await ctx.db.pageSettings.findUnique({
        where: { pageId: input.pageId },
      });

      if (!pageSettings) {
        pageSettings = await ctx.db.pageSettings.create({
          data: {
            pageId: input.pageId,
          },
        });
      }

      // Create FAQ rule
      const faqRule = await ctx.db.fAQRule.create({
        data: {
          pageSettingsId: pageSettings.id,
          assertion: input.assertion,
          response: input.response,
        },
      });

      return faqRule;
    }),

  /**
   * Delete FAQ rule
   */
  deleteFAQRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify rule belongs to user's page
      const rule = await ctx.db.fAQRule.findUnique({
        where: { id: input.ruleId },
        include: {
          pageSettings: {
            include: {
              page: true,
            },
          },
        },
      });

      if (!rule || rule.pageSettings.page.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'FAQ rule not found or access denied',
        });
      }

      await ctx.db.fAQRule.delete({
        where: { id: input.ruleId },
      });

      return { success: true };
    }),

  /**
   * Get undesirable comments statistics for date ranges
   */
  getUndesirableCommentsStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const count = await ctx.db.comment.count({
        where: {
          action: {
            in: ['hide', 'delete'],
          },
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
          post: {
            page: {
              userId,
            },
          },
        },
      });

      return {
        count,
        startDate: input.startDate,
        endDate: input.endDate,
      };
    }),

  /**
   * Get undesirable comments statistics for multiple date ranges
   */
  getUndesirableCommentsStatsMultiple: protectedProcedure
    .input(
      z.object({
        intervals: z.array(
          z.object({
            startDate: z.date(),
            endDate: z.date(),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const results = await Promise.all(
        input.intervals.map(async (interval) => {
          const count = await ctx.db.comment.count({
            where: {
              action: {
                in: ['hide', 'delete'],
              },
              createdAt: {
                gte: interval.startDate,
                lte: interval.endDate,
              },
              post: {
                page: {
                  userId,
                },
              },
            },
          });

          return {
            count,
            startDate: interval.startDate,
            endDate: interval.endDate,
          };
        })
      );

      return results;
    }),
});
