/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@cloudflare/workers-types" />
import type * as trpcNext from '@trpc/server/adapters/next';
import { prisma, createPrismaWithD1 } from './prisma';
import { auth } from '~/lib/auth';
import type { Session, User } from '~/lib/auth';

interface CreateContextOptions {
  session?: Session | null;
  user?: User | null;
  d1?: D1Database;
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export async function createContextInner(opts: CreateContextOptions) {
  const db = opts.d1 ? createPrismaWithD1(opts.d1) : prisma;

  return {
    db,
    session: opts.session,
    user: opts.user,
  };
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export async function createContext(
  opts: trpcNext.CreateNextContextOptions,
): Promise<Context> {
  // for API-response caching see https://trpc.io/docs/v11/caching

  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: opts.req.headers as any,
  });

  // In Cloudflare Workers environment, D1 database will be available in env
  const d1 = (opts.req as any)?.env?.moderateur_bedones_db;

  return await createContextInner({
    d1,
    session: session?.session || null,
    user: session?.user || null,
  });
}
