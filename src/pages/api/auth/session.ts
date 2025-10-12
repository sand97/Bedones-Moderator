// Use edge runtime for Cloudflare deployment
export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { validateSession, SESSION_COOKIE_NAME } from '~/lib/auth';
import type { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper to get session token from headers (works with both Edge and Node.js)
function getSessionToken(headers: Headers | NextApiRequest['headers']): string | null {
  let cookieHeader: string | null | undefined;

  if (headers instanceof Headers) {
    cookieHeader = headers.get('cookie');
  } else {
    cookieHeader = headers.cookie;
  }

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}

export default async function handler(req: NextApiRequest | Request, res?: NextApiResponse) {
  // Check if we're in Edge runtime by testing if req is a Web Request
  const isEdgeRuntime = req instanceof Request;

  // Handle Next.js API route (Node.js runtime)
  if (!isEdgeRuntime && res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      console.log('[Session] Handler called (Node.js runtime)');

      if (!defaultPrisma) {
        console.error('[Session] No Prisma client available');
        return res.status(500).json({ error: 'Database not configured' });
      }

      const token = getSessionToken((req as NextApiRequest).headers);
      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const sessionData = await validateSession(defaultPrisma, token);
      if (!sessionData) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      return res.status(200).json({
        session: sessionData.session,
        user: sessionData.user,
      });
    } catch (error) {
      console.error('[Session] Error:', error);
      return res.status(500).json({ error: 'Session fetch failed' });
    }
  }

  // Handle Edge runtime (Cloudflare)
  const request = req as Request;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[Session] Handler called (Edge runtime)');

    const { env } = getRequestContext();
    const d1 = env.moderateur_bedones_db;

    if (!d1) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prisma = createPrismaWithD1(d1);
    const token = getSessionToken(request.headers);

    if (!token) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session
    const sessionData = await validateSession(prisma, token);

    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return session and user data
    return new Response(JSON.stringify({
      session: sessionData.session,
      user: sessionData.user,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Session] Error:', error);
    console.error('[Session] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ error: 'Session fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
