/**
 * Cron Job Utilities
 *
 * Automated tasks for subscription renewals and credit management
 */

import { prisma } from '@/server/prisma';
import { refillMonthlyCredits } from './credit-utils';
import { getNextResetDate } from './subscription-utils';

export interface CronJobResult {
  success: boolean;
  timestamp: Date;
  usersProcessed: number;
  creditsRefilled: number;
  subscriptionsExpired: number;
  errors: string[];
}

/**
 * Daily cron job: Refill monthly credits and handle expirations
 * Should run daily at 18:00 (or any consistent time)
 */
export async function dailyCreditRenewalJob(): Promise<CronJobResult> {
  const result: CronJobResult = {
    success: true,
    timestamp: new Date(),
    usersProcessed: 0,
    creditsRefilled: 0,
    subscriptionsExpired: 0,
    errors: [],
  };

  try {
    console.log('🔄 Starting daily credit renewal job...');

    // 1. Find all active subscriptions that need credit renewal
    const subscriptionsToRenew = await prisma.subscription.findMany({
      where: {
        tier: {
          not: 'FREE',
        },
        usageResetDate: {
          lte: new Date(), // Reset date is today or in the past
        },
        OR: [
          { expiresAt: null }, // Stripe subscriptions (auto-renewing)
          {
            expiresAt: {
              gte: new Date(), // NotchPay subscriptions still active
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `📊 Found ${subscriptionsToRenew.length} subscriptions ready for renewal`
    );

    // 2. Process each subscription renewal
    for (const subscription of subscriptionsToRenew) {
      try {
        // Refill credits for all user's pages
        const refillResult = await refillMonthlyCredits(
          subscription.userId,
          subscription
        );

        // Update the usage reset date to next month
        const nextResetDate = getNextResetDate();
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            usageResetDate: nextResetDate,
            currentMonthUsage: 0, // Reset legacy usage counter
            updatedAt: new Date(),
          },
        });

        result.usersProcessed++;
        result.creditsRefilled += refillResult.totalCreditsAdded;

        console.log(
          `✅ Renewed credits for user ${subscription.user.email} - ${refillResult.totalCreditsAdded} credits added to ${refillResult.pagesRefilled} pages`
        );
      } catch (error) {
        const errorMsg = `Failed to renew credits for user ${subscription.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    // 3. Handle expired subscriptions (NotchPay multi-month purchases)
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        tier: {
          not: 'FREE',
        },
        expiresAt: {
          lt: new Date(), // Expired
        },
        // Only for NotchPay subscriptions (Stripe ones don't have expiresAt)
        stripeSubscriptionId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `⏰ Found ${expiredSubscriptions.length} expired subscriptions`
    );

    // 4. Downgrade expired subscriptions to FREE
    for (const subscription of expiredSubscriptions) {
      try {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            tier: 'FREE',
            planName: 'Free',
            monthlyModerationCredits: 0,
            monthlyFaqCredits: 0,
            monthlyCommentLimit: 100,
            expiresAt: null,
            updatedAt: new Date(),
          },
        });

        result.subscriptionsExpired++;

        console.log(
          `⬇️ Downgraded expired subscription for user ${subscription.user.email} to FREE tier`
        );

        // TODO: Send email notification to user about expiration
      } catch (error) {
        const errorMsg = `Failed to expire subscription for user ${subscription.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.success = false;
      }
    }

    console.log('✅ Daily credit renewal job completed successfully');
    console.log(`📈 Stats: ${result.usersProcessed} users, ${result.creditsRefilled} credits, ${result.subscriptionsExpired} expired`);

    return result;
  } catch (error) {
    console.error('❌ Critical error in daily cron job:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown critical error'
    );
    return result;
  }
}

/**
 * Weekly reminder job: Notify users with low credits or expiring subscriptions
 * Should run weekly (e.g., every Monday at 09:00)
 */
export async function weeklyReminderJob(): Promise<{
  success: boolean;
  reminders: number;
  errors: string[];
}> {
  const result = {
    success: true,
    reminders: 0,
    errors: [] as string[],
  };

  try {
    console.log('📧 Starting weekly reminder job...');

    // Find subscriptions expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        tier: {
          not: 'FREE',
        },
        expiresAt: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `📬 Found ${expiringSubscriptions.length} subscriptions expiring soon`
    );

    for (const subscription of expiringSubscriptions) {
      // TODO: Send email reminder
      console.log(
        `📩 Reminder: Subscription for ${subscription.user.email} expires on ${subscription.expiresAt}`
      );
      result.reminders++;
    }

    // Find users with low credits (< 10% remaining)
    // This would require fetching all pages and their credits
    // TODO: Implement low credit warnings

    console.log(`✅ Weekly reminder job completed: ${result.reminders} reminders sent`);

    return result;
  } catch (error) {
    console.error('❌ Error in weekly reminder job:', error);
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
    return result;
  }
}

/**
 * Verify cron job authentication token
 */
export function verifyCronToken(token: string | undefined): boolean {
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    throw new Error('CRON_SECRET is not configured in environment variables');
  }

  return token === expectedToken;
}
