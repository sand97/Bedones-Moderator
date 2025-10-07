import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const commentsRouter = router({
  /**
   * Get comments with filters and pagination
   */
  getComments: protectedProcedure
    .input(
      z.object({
        pageId: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.string().optional()
        ),
        authorName: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.string().optional()
        ),
        action: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.enum(['none', 'hide', 'delete', 'reply']).optional()
        ),
        dateFrom: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.string().optional()
        ),
        dateTo: z.preprocess(
          (val) => (val === '' ? undefined : val),
          z.string().optional()
        ),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { pageId, authorName, action, dateFrom, dateTo, page, pageSize } = input;

      // Build where clause
      const where: any = {};

      // Only show comments from pages owned by the current user
      if (pageId) {
        where.pageId = pageId;
      } else {
        // Get all page IDs for the current user
        const userPages = await ctx.db.page.findMany({
          where: { userId: ctx.user.id },
          select: { id: true },
        });
        where.pageId = { in: userPages.map((p) => p.id) };
      }

      if (authorName) {
        where.fromName = { contains: authorName };
      }

      if (action) {
        where.action = action;
      }

      if (dateFrom || dateTo) {
        where.createdTime = {};
        if (dateFrom) {
          where.createdTime.gte = new Date(dateFrom);
        }
        if (dateTo) {
          where.createdTime.lte = new Date(dateTo);
        }
      }

      // Get total count
      const total = await ctx.db.comment.count({ where });

      // Get comments with pagination
      const comments = await ctx.db.comment.findMany({
        where,
        include: {
          post: {
            include: {
              page: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return {
        comments,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Autocomplete author names
   */
  searchAuthors: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get all page IDs for the current user
      const userPages = await ctx.db.page.findMany({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const pageIds = userPages.map((p) => p.id);

      // Find distinct author names matching the query
      const authors = await ctx.db.comment.findMany({
        where: {
          pageId: { in: pageIds },
          fromName: { contains: input.query },
        },
        select: {
          fromId: true,
          fromName: true,
        },
        distinct: ['fromId'],
        take: input.limit,
        orderBy: { createdTime: 'desc' },
      });

      return authors.map((a) => ({
        id: a.fromId,
        name: a.fromName,
      }));
    }),
});
