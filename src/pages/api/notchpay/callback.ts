import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/server/prisma';
import { verifyNotchPayPayment } from '@/lib/notchpay-utils';
import { getNextResetDate } from '@/lib/subscription-utils';
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
      const monthlyCommentLimit = metadata.monthlyCommentLimit as number;

      // Calculate expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Calculate next usage reset date
      const usageResetDate = getNextResetDate();

      // Update subscription
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          tier,
          planName,
          monthlyCommentLimit,
          currentMonthUsage: 0, // Reset usage
          usageResetDate,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Payment successful for user ${payment.subscription.userId}`);
      return res.redirect('/dashboard?payment=success');
    } else if (verification.transaction.status === 'failed' || verification.transaction.status === 'cancelled') {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      });

      console.log(`❌ Payment failed for user ${payment.subscription.userId}`);
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
