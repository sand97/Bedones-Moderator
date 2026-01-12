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
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { reference, trxref, status } = req.query;

    console.log('🔍 NotchPay callback query params:', { reference, trxref, status });

    // Handle reference - NotchPay sends it twice sometimes (our ref + their trx ref)
    let ourReference: string;
    let notchpayReference: string;

    if (Array.isArray(reference)) {
      // If it's an array, first is our reference, second is NotchPay's trx reference
      ourReference = reference[0];
      notchpayReference = reference[1] || reference[0];
    } else if (typeof reference === 'string') {
      ourReference = reference;
      notchpayReference = reference;
    } else if (typeof trxref === 'string') {
      // Fallback to trxref if reference is not available
      ourReference = trxref;
      notchpayReference = trxref;
    } else {
      console.error('❌ No valid reference found in query params');
      res.redirect('/dashboard/payment-method?payment=error');
      return;
    }

    // Clean up the references
    ourReference = ourReference.split(',')[0].trim();
    notchpayReference = notchpayReference.split(',')[0].trim();

    console.log(`🔍 Using our reference: ${ourReference}, NotchPay ref: ${notchpayReference}`);

    // Find the pending payment
    const payment = await prisma.payment.findFirst({
      where: {
        notchpayTransactionId: ourReference,
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
      console.error('❌ Payment not found:', ourReference);
      res.redirect('/dashboard/payment-method?payment=error');
      return;
    }

    // Verify payment status with NotchPay using their transaction reference
    console.log(`📞 Verifying payment with NotchPay: ${notchpayReference}`);
    const verification = await verifyNotchPayPayment(notchpayReference);

    if (verification.transaction.status === 'complete') {
      // Parse metadata to get plan details
      const metadata = payment.metadata
        ? JSON.parse(payment.metadata)
        : null;

      if (!metadata) {
        console.error('❌ Payment metadata not found:', payment.id);
        res.redirect('/dashboard/payment-method?payment=error');
        return;
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

      // Refill credits for the user
      const creditRefill = await refillMonthlyCredits(
        payment.subscription.userId,
        updatedSubscription
      );

      console.log(
        `💳 Credits refilled: ${creditRefill.creditsAdded} total credits added`
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
          creditsAdded: creditRefill.creditsAdded,
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

      res.redirect('/dashboard/payment-method?payment=success');
      return;
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

      res.redirect('/dashboard/payment-method?payment=cancelled');
      return;
    } else {
      // Payment still pending
      console.log(`⏳ Payment pending for user ${payment.subscription.userId}`);
      res.redirect('/dashboard/payment-method?payment=pending');
      return;
    }
  } catch (error) {
    console.error('❌ NotchPay callback error:', error);
    res.redirect('/dashboard/payment-method?payment=error');
    return;
  }
}
