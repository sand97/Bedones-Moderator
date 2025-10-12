import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { FacebookService } from '../services/facebook';
import { InstagramService } from '../services/instagram';
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Fetch pages from Facebook
        const pages = await FacebookService.fetchUserPages(input.accessToken);

        // Save pages to database
        await FacebookService.saveUserPages(
          userId,
          input.accessToken,
          pages,
          ctx.db,
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

      if (!facebookAccount?.accessToken) {
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
        ctx.db,
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
      }),
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
      }),
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
   * Update FAQ rule
   */
  updateFAQRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        assertion: z.string().min(3),
        response: z.string().min(3),
      }),
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

      const updatedRule = await ctx.db.fAQRule.update({
        where: { id: input.ruleId },
        data: {
          assertion: input.assertion,
          response: input.response,
        },
      });

      return updatedRule;
    }),

  /**
   * Delete FAQ rule
   */
  deleteFAQRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
      }),
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
      }),
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
          }),
        ),
      }),
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
        }),
      );

      return results;
    }),

  /**
   * Get user's connected Instagram accounts (using Page model with provider filter)
   */
  getInstagramAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const accounts = await ctx.db.page.findMany({
      where: {
        userId,
        provider: 'INSTAGRAM',
      },
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

    return accounts;
  }),

  /**
   * Update Instagram account settings (uses same updatePageSettings)
   */
  updateInstagramAccountSettings: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        undesiredCommentsEnabled: z.boolean().optional(),
        undesiredCommentsAction: z.enum(['hide', 'delete']).optional(),
        spamDetectionEnabled: z.boolean().optional(),
        spamAction: z.enum(['hide', 'delete']).optional(),
        intelligentFAQEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { accountId, ...settings } = input;

      // Verify page belongs to user and is Instagram
      const page = await ctx.db.page.findFirst({
        where: {
          id: accountId,
          userId: ctx.user.id,
          provider: 'INSTAGRAM',
        },
      });

      if (!page) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Instagram account not found or access denied',
        });
      }

      // Update settings (same as Facebook)
      const pageSettings = await ctx.db.pageSettings.upsert({
        where: { pageId: accountId },
        create: {
          pageId: accountId,
          ...settings,
        },
        update: settings,
      });

      return pageSettings;
    }),

  /**
   * Add FAQ rule to an Instagram account (uses same FAQ rules)
   */
  addInstagramFAQRule: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        assertion: z.string().min(3),
        response: z.string().min(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify page belongs to user and is Instagram
      const page = await ctx.db.page.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.user.id,
          provider: 'INSTAGRAM',
        },
      });

      if (!page) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Instagram account not found or access denied',
        });
      }

      // Get or create page settings
      let pageSettings = await ctx.db.pageSettings.findUnique({
        where: { pageId: input.accountId },
      });

      if (!pageSettings) {
        pageSettings = await ctx.db.pageSettings.create({
          data: {
            pageId: input.accountId,
          },
        });
      }

      // Create FAQ rule (same as Facebook)
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
   * Update Instagram FAQ rule (uses same FAQ rules)
   */
  updateInstagramFAQRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
        assertion: z.string().min(3),
        response: z.string().min(3),
      }),
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

      if (
        !rule ||
        rule.pageSettings.page.userId !== ctx.user.id ||
        rule.pageSettings.page.provider !== 'INSTAGRAM'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Instagram FAQ rule not found or access denied',
        });
      }

      const updatedRule = await ctx.db.fAQRule.update({
        where: { id: input.ruleId },
        data: {
          assertion: input.assertion,
          response: input.response,
        },
      });

      return updatedRule;
    }),

  /**
   * Delete Instagram FAQ rule (uses same FAQ rules)
   */
  deleteInstagramFAQRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.string(),
      }),
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

      if (
        !rule ||
        rule.pageSettings.page.userId !== ctx.user.id ||
        rule.pageSettings.page.provider !== 'INSTAGRAM'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Instagram FAQ rule not found or access denied',
        });
      }

      await ctx.db.fAQRule.delete({
        where: { id: input.ruleId },
      });

      return { success: true };
    }),

  /**
   * Auto-sync Instagram accounts using stored access token
   */
  autoSyncInstagramAccounts: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      // Get Instagram account with access token
      const instagramAccount = await ctx.db.account.findFirst({
        where: {
          userId,
          providerId: 'instagram',
        },
      });

      if (!instagramAccount?.accessToken) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Instagram account or access token not found',
        });
      }

      // Fetch Instagram accounts
      const accounts = await InstagramService.fetchUserInstagramAccounts(
        instagramAccount.accessToken,
      );

      // Save accounts to database
      await InstagramService.saveUserInstagramAccounts(
        userId,
        instagramAccount.accessToken,
        accounts,
        ctx.db,
      );

      return {
        success: true,
        accountsCount: accounts.length,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync Instagram accounts',
        cause: error,
      });
    }
  }),

  /**
   * Get followers (commenters) with their statistics
   */
  getFollowers: protectedProcedure
    .input(
      z.object({
        pageId: z.string().optional(),
        followerName: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { pageId, followerName, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        post: {
          page: {
            userId,
          },
        },
      };

      if (pageId) {
        where.post.page.id = pageId;
      }

      if (followerName) {
        where.fromName = {
          contains: followerName,
        };
      }

      // Get all comments grouped by fromId
      const comments = await ctx.db.comment.findMany({
        where,
        select: {
          fromId: true,
          fromName: true,
          pageId: true,
          action: true,
          post: {
            select: {
              page: {
                select: {
                  id: true,
                  name: true,
                  provider: true,
                },
              },
            },
          },
        },
      });

      // Group by fromId and pageId
      const followerMap = new Map<
        string,
        {
          fromId: string;
          fromName: string;
          pageId: string;
          pageName: string;
          provider: string;
          totalComments: number;
          suspectComments: number;
        }
      >();

      comments.forEach((comment) => {
        const key = `${comment.fromId}-${comment.pageId}`;

        if (!followerMap.has(key)) {
          followerMap.set(key, {
            fromId: comment.fromId,
            fromName: comment.fromName,
            pageId: comment.post.page.id,
            pageName: comment.post.page.name,
            provider: comment.post.page.provider,
            totalComments: 0,
            suspectComments: 0,
          });
        }

        const follower = followerMap.get(key)!;
        follower.totalComments++;

        // Count suspect comments (hide or delete actions)
        if (comment.action === 'hide' || comment.action === 'delete') {
          follower.suspectComments++;
        }
      });

      // Convert to array and sort by suspect comments desc
      const followers = Array.from(followerMap.values()).sort(
        (a, b) => b.suspectComments - a.suspectComments,
      );

      // Paginate
      const total = followers.length;
      const paginatedFollowers = followers.slice(skip, skip + limit);

      return {
        followers: paginatedFollowers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});
