import { prisma } from '~/server/prisma';
import { deleteSession, deleteSessionCookie, SESSION_COOKIE_NAME } from '~/lib/auth';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Signout] Handler called');

    if (!prisma) {
      console.error('[Signout] No Prisma client available');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const token = getSessionToken(req.headers);
    if (token) {
      await deleteSession(prisma, token);
    }

    res.setHeader('Set-Cookie', deleteSessionCookie());
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Signout] Error:', error);
    return res.status(500).json({ error: 'Sign out failed' });
  }
}
