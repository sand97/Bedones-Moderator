/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="@cloudflare/workers-types" />
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createPrismaWithD1, prisma as defaultPrisma } from './prisma';
import { getSessionTokenFromRequest, validateSession, SESSION_COOKIE_NAME } from '~/lib/auth';
import type { Session, User } from '~/lib/auth';
import type { PrismaClient } from '@prisma/client';

interface CreateContextOptions {
  session?: Session | null;
  user?: User | null;
  db: PrismaClient;
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export async function createContextInner(opts: CreateContextOptions) {
  return {
    db: opts.db,
    session: opts.session,
    user: opts.user,
  };
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

/**
 * Helper to get session token from headers (works with both Edge and Node.js)
 */
function getSessionToken(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  let cookieHeader: string | null | undefined;

  if (headers instanceof Headers) {
    cookieHeader = headers.get('cookie');
  } else {
    cookieHeader = headers.cookie as string | undefined;
  }

  console.log('[Context] Cookie header:', cookieHeader);
  console.log('[Context] Looking for cookie:', SESSION_COOKIE_NAME);

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  console.log('[Context] All cookies:', cookies.map(c => c.split('=')[0]));

  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) {
    console.log('[Context] Session cookie not found');
    return null;
  }

  const token = sessionCookie.split('=')[1] || null;
  console.log('[Context] Found session token:', token ? token.substring(0, 10) + '...' : 'null');
  return token;
}

/**
 * Creates context for an incoming request (Edge Runtime / Fetch API)
 * @see https://trpc.io/docs/v11/context
 */
export async function createContext(
  opts: FetchCreateContextFnOptions & { cloudflareEnv?: any },
): Promise<Context> {
  // for API-response caching see https://trpc.io/docs/v11/caching

  console.log('[Context] Creating context');
  console.log('[Context] Has cloudflareEnv:', !!opts.cloudflareEnv);

  // Try to use Cloudflare D1, fall back to local development
  let prisma: PrismaClient;

  // In Cloudflare Workers environment, D1 database will be available in env
  const d1 = opts.cloudflareEnv?.moderateur_bedones_db;

  if (d1) {
    console.log('[Context] Using D1 database (Edge runtime)');
    prisma = createPrismaWithD1(d1);
  } else if (defaultPrisma) {
    console.log('[Context] Using local SQLite database (Node.js runtime)');
    prisma = defaultPrisma;
  } else {
    console.error('[Context] No database available');
    throw new Error('Database not configured');
  }

  // Get session from custom auth
  const token = getSessionToken(opts.req.headers);

  let session: Session | null = null;
  let user: User | null = null;

  if (token) {
    console.log('[Context] Token found, validating session');
    try {
      const sessionData = await validateSession(prisma, token);
      if (sessionData) {
        session = sessionData.session;
        user = sessionData.user;
        console.log('[Context] Session validated successfully');
      } else {
        console.log('[Context] Session validation returned null');
      }
    } catch (error) {
      console.error('[Context] Error during session validation:', error);
    }
  } else {
    console.log('[Context] No token found in request');
  }

  console.log('[Context] Returning context with user:', user ? user.id : 'null');

  return await createContextInner({
    db: prisma,
    session,
    user,
  });
}
