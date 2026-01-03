import { prisma } from '~/server/prisma';
import { validateSession, SESSION_COOKIE_NAME } from '~/lib/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper to get session token from headers
function getSessionToken(headers: NextApiRequest['headers']): string | null {
  const cookieHeader = headers.cookie;

  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Session] Handler called');

    if (!prisma) {
      console.error('[Session] No Prisma client available');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const token = getSessionToken(req.headers);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessionData = await validateSession(prisma, token);
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
