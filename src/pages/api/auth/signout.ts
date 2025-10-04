import type { NextApiRequest, NextApiResponse } from 'next';
import { createPrismaWithD1, prisma as defaultPrisma } from '~/server/prisma';
import { getSessionTokenFromRequest, deleteSession, deleteSessionCookie } from '~/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get D1 binding from request env (Cloudflare Workers)
    const d1 = (req as any)?.env?.moderateur_bedones_db;
    const prisma = d1 ? createPrismaWithD1(d1) : defaultPrisma;

    // Get session token from request
    const headers = new Headers(req.headers as any);
    const token = getSessionTokenFromRequest(headers);

    if (token) {
      // Delete session from database
      await deleteSession(prisma, token);
    }

    // Clear session cookie
    res.setHeader('Set-Cookie', deleteSessionCookie());
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({ error: 'Sign out failed' });
  }
}
