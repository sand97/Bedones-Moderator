import type { NextApiRequest, NextApiResponse } from 'next';
import { weeklyReminderJob, verifyCronToken } from '@/lib/cron-utils';

/**
 * Weekly Cron Job: Reminders
 *
 * Triggers weekly (e.g., every Monday at 09:00) to:
 * 1. Send reminders for subscriptions expiring in 7 days
 * 2. Notify users with low credit balances
 *
 * Security: Requires CRON_SECRET token in Authorization header
 *
 * Usage with Cloudflare Cron Triggers:
 * - Set schedule: "0 9 * * 1" (every Monday at 09:00 UTC)
 * - Set environment variable: CRON_SECRET=your-secret-token
 *
 * Usage with external cron service:
 * - URL: https://your-domain.com/api/cron/weekly-reminder
 * - Method: POST
 * - Header: Authorization: Bearer YOUR_CRON_SECRET
 * - Schedule: Every Monday at 09:00
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

    // Execute the weekly reminder job
    const startTime = Date.now();
    const result = await weeklyReminderJob();
    const duration = Date.now() - startTime;

    console.log(`⏱️ Weekly reminder job completed in ${duration}ms`);

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      duration,
      stats: {
        reminders: result.reminders,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('❌ Critical error in weekly reminder endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
