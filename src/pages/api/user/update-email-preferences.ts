/**
 * API Endpoint: Update Email Preferences
 * Allows users to opt in/out of marketing emails
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { rateLimit, RateLimitPresets } from '../../../lib/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (!rateLimit(req, res, RateLimitPresets.STANDARD)) {
    return;
  }

  try {
    // Get session from cookies
    const cookies = req.cookies;
    const sessionToken = cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate session
    const sessionData = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!sessionData || sessionData.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const userId = sessionData.userId;
    const { emailSubscribed } = req.body;

    // Validate input
    if (typeof emailSubscribed !== 'boolean') {
      return res.status(400).json({ error: 'Invalid emailSubscribed value' });
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailSubscribed,
      },
    });

    console.log(`[Email Preferences] User ${userId} updated emailSubscribed to ${emailSubscribed}`);

    return res.status(200).json({
      success: true,
      emailSubscribed: updatedUser.emailSubscribed,
    });
  } catch (error) {
    console.error('[Email Preferences] Error:', error);
    return res.status(500).json({
      error: 'Failed to update email preferences',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}