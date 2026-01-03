import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from './prisma';
import { validateSession, SESSION_COOKIE_NAME } from '~/lib/auth';
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
 * Helper to get session token from headers
 */
function getSessionToken(headers: Headers): string | null {
  const cookieHeader = headers.get('cookie');

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
 * Creates context for an incoming request
 * @see https://trpc.io/docs/v11/context
 */
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  // for API-response caching see https://trpc.io/docs/v11/caching

  console.log('[Context] Creating context');

  if (!prisma) {
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
