import type { NextApiRequest, NextApiResponse } from 'next';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { getSessionTokenFromRequest, validateSession } from '~/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get D1 binding from request env (Cloudflare Workers)
    const d1 = (req as any)?.env?.moderateur_bedones_db;
    const prisma = d1 ? createPrismaWithD1(d1) : defaultPrisma;

    // Get session token from request
    const headers = new Headers(req.headers as any);
    const token = getSessionTokenFromRequest(headers);

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate session
    const sessionData = await validateSession(prisma, token);

    if (!sessionData) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Return session and user data
    return res.status(200).json({
      session: sessionData.session,
      user: sessionData.user,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return res.status(500).json({ error: 'Session fetch failed' });
  }
}
