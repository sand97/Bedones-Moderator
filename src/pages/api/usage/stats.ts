import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { getUserUsageStats } from '../../../lib/usage-tracking';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Parse query parameters
    const { startDate, endDate, days } = req.query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (days && typeof days === 'string') {
      // Get stats for last N days
      const daysNum = parseInt(days, 10);
      if (isNaN(daysNum) || daysNum < 1) {
        return res.status(400).json({ error: 'Invalid days parameter' });
      }

      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - daysNum);
    } else {
      if (startDate && typeof startDate === 'string') {
        start = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        end = new Date(endDate);
      }
    }

    // Get usage stats
    const stats = await getUserUsageStats(prisma, sessionData.userId, {
      startDate: start,
      endDate: end,
    });

    // Get subscription info for context
    const subscription = await prisma.subscription.findUnique({
      where: { userId: sessionData.userId },
    });

    return res.status(200).json({
      ...stats,
      subscription: subscription ? {
        tier: subscription.tier,
        monthlyLimit: subscription.monthlyCommentLimit,
        currentUsage: subscription.currentMonthUsage,
        usagePercentage: (subscription.currentMonthUsage / subscription.monthlyCommentLimit) * 100,
        commentsRemaining: subscription.monthlyCommentLimit - subscription.currentMonthUsage,
        resetDate: subscription.usageResetDate,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
}
