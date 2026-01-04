import type { NextApiRequest, NextApiResponse } from 'next';
import { dailyCreditRenewalJob, verifyCronToken } from '../../../lib/cron-utils';

/**
 * Daily Cron Job: Credit Renewal
 *
 * Triggers daily at 18:00 to:
 * 1. Refill monthly credits for active subscriptions
 * 2. Downgrade expired subscriptions to FREE tier
 *
 * Security: Requires CRON_SECRET token in Authorization header
 *
 * Usage with Cloudflare Cron Triggers:
 * - Set schedule: "0 18 * * *" (daily at 18:00 UTC)
 * - Set environment variable: CRON_SECRET=your-secret-token
 *
 * Usage with external cron service (cron-job.org, etc.):
 * - URL: https://your-domain.com/api/cron/daily-renewal
 * - Method: POST
 * - Header: Authorization: Bearer YOUR_CRON_SECRET
 * - Schedule: Daily at 18:00
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify cron token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!verifyCronToken(token)) {
      console.error('❌ Unauthorized cron job attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Execute the daily renewal job
    const startTime = Date.now();
    const result = await dailyCreditRenewalJob();
    const duration = Date.now() - startTime;

    // Log the result
    console.log(`⏱️ Cron job completed in ${duration}ms`);

    // Return detailed result
    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      timestamp: result.timestamp,
      duration,
      stats: {
        usersProcessed: result.usersProcessed,
        creditsRefilled: result.creditsRefilled,
        subscriptionsExpired: result.subscriptionsExpired,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('❌ Critical error in cron endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
