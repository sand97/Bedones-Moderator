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
});
