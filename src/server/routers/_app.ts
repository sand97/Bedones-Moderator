/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { postRouter } from './post';
import { authRouter } from './auth';
import { commentsRouter } from './comments';
import { subscriptionRouter } from './subscription';
import { usageRouter } from './usage';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  post: postRouter,
  auth: authRouter,
  comments: commentsRouter,
  subscription: subscriptionRouter,
  usage: usageRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
