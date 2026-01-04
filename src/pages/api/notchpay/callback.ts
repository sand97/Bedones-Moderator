import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import { verifyNotchPayPayment } from '../../../lib/notchpay-utils';
import { getNextResetDate } from '../../../lib/subscription-utils';
import { refillMonthlyCredits } from '../../../lib/credit-utils';
import { sendEmail } from '../../../lib/email/mailer';
import { paymentSuccessEmail, paymentFailedEmail } from '../../../lib/email/templates';
import type { SubscriptionTier } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.redirect('/?payment=error');
  }

  try {
    // Find the pending payment
    const payment = await prisma.payment.findFirst({
      where: {
        notchpayTransactionId: reference,
        status: 'PENDING',
      },
      include: {
        subscription: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      console.error('Payment not found:', reference);
      return res.redirect('/?payment=not-found');
    }

    // Verify payment status with NotchPay
    const verification = await verifyNotchPayPayment(reference);

    if (verification.transaction.status === 'complete') {
      // Parse metadata to get plan details
      const metadata = payment.metadata
        ? JSON.parse(payment.metadata)
        : null;

      if (!metadata) {
        console.error('Payment metadata not found:', payment.id);
        return res.redirect('/?payment=error');
      }

      const tier = metadata.tier as SubscriptionTier;
      const planName = metadata.planName as string;
      const monthlyModerationCredits = metadata.monthlyModerationCredits as number;
      const monthlyFaqCredits = metadata.monthlyFaqCredits as number;
      const months = metadata.months as number || 1;

      // Calculate period dates
      const now = new Date();
      const currentPeriodStart = now;
      const currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);

      // Calculate next usage reset date (beginning of next month)
      const usageResetDate = getNextResetDate();

      // Update subscription with multi-month support
      const updatedSubscription = await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          tier,
          planName,
          monthlyModerationCredits,
          monthlyFaqCredits,
          monthsPurchased: months,
          currentPeriodStart,
          currentPeriodEnd,
          // Legacy fields (keep for backwards compatibility)
          monthlyCommentLimit: monthlyModerationCredits,
          currentMonthUsage: 0,
          usageResetDate,
          expiresAt: currentPeriodEnd,
          updatedAt: new Date(),
        },
      });

      // Refill credits for all user's pages
      const creditRefill = await refillMonthlyCredits(
        payment.subscription.userId,
        updatedSubscription
      );

      console.log(
        `💳 Credits refilled for ${creditRefill.pagesRefilled} pages (${creditRefill.totalCreditsAdded} total credits)`
      );

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      console.log(
        `✅ Payment successful for user ${payment.subscription.userId} - ${months} month(s) of ${planName}`
      );

      // Send payment success email
      if (payment.subscription.user.email && payment.subscription.user.emailVerified) {
        const emailTemplate = paymentSuccessEmail({
          userName: payment.subscription.user.name || payment.subscription.user.email,
          planName,
          amount: payment.amount,
          currency: payment.currency,
          months,
          expiresAt: currentPeriodEnd,
          creditsAdded: creditRefill.totalCreditsAdded,
        });

        await sendEmail({
          to: payment.subscription.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          previewText: emailTemplate.previewText,
          userId: payment.subscription.userId,
          campaignType: 'PAYMENT_SUCCESS',
          campaignName: 'payment-success',
        });

        console.log(`📧 Payment success email sent to ${payment.subscription.user.email}`);
      }

      return res.redirect('/dashboard?payment=success');
    } else if (
      verification.transaction.status === 'failed' ||
      verification.transaction.status === 'cancelled'
    ) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      });

      console.log(`❌ Payment failed for user ${payment.subscription.userId}`);

      // Send payment failed email
      if (payment.subscription.user.email && payment.subscription.user.emailVerified) {
        const metadata = payment.metadata ? JSON.parse(payment.metadata) : null;
        const planName = metadata?.planName || 'Plan';

        const emailTemplate = paymentFailedEmail({
          userName: payment.subscription.user.name || payment.subscription.user.email,
          planName,
          amount: payment.amount,
          currency: payment.currency,
          reason: verification.transaction.reason,
        });

        await sendEmail({
          to: payment.subscription.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          previewText: emailTemplate.previewText,
          userId: payment.subscription.userId,
          campaignType: 'PAYMENT_FAILED',
          campaignName: 'payment-failed',
        });

        console.log(`📧 Payment failed email sent to ${payment.subscription.user.email}`);
      }

      return res.redirect('/?payment=failed');
    } else {
      // Payment still pending
      console.log(`⏳ Payment pending for user ${payment.subscription.userId}`);
      return res.redirect('/?payment=pending');
    }
  } catch (error) {
    console.error('NotchPay callback error:', error);
    return res.redirect('/?payment=error');
  }
}
