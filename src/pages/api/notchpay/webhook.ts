import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma.ts';
import {
  verifyNotchPaySignature,
  type NotchPayWebhookPayload,
} from '~/lib/notchpay-utils.ts';
import { refillMonthlyCredits } from '~/lib/credit-utils.ts';
import { getNextResetDate } from '~/lib/subscription-utils.ts';
import type { SubscriptionTier } from '@prisma/client';

// Disable body parser to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Get raw body and signature
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-notch-signature'] as string;

    if (!signature) {
      console.error('❌ No x-notch-signature header found');
      res.status(400).json({ error: 'No signature provided' });
      return;
    }

    // Verify signature
    if (!verifyNotchPaySignature(rawBody, signature)) {
      console.error('⚠️  NotchPay webhook signature verification failed');
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const payload: NotchPayWebhookPayload = JSON.parse(rawBody);
    console.log(`✅ NotchPay webhook received: ${payload.event}`);

    switch (payload.event) {
      case 'payment.complete':
        await handlePaymentComplete(payload);
        break;

      case 'payment.failed':
      case 'payment.cancelled':
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(`ℹ️  Unhandled NotchPay event type: ${payload.event}`);
    }

    res.json({ received: true });
    return;
  } catch (error) {
    console.error('❌ NotchPay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
    return;
  }
}

async function handlePaymentComplete(payload: NotchPayWebhookPayload) {
  const { transaction } = payload;
  const reference = transaction.reference;

  console.log(`🔍 Processing NotchPay payment complete: ${reference}`);

  // Find the payment by reference
  const payment = await prisma.payment.findFirst({
    where: {
      notchpayTransactionId: reference,
      paymentProvider: 'NOTCHPAY',
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
    console.error(`❌ Payment not found for reference: ${reference}`);
    return;
  }

  // If already completed, skip
  if (payment.status === 'COMPLETED') {
    console.log(`ℹ️  Payment already processed: ${reference}`);
    return;
  }

  // Parse metadata to get plan details
  const metadata = payment.metadata ? JSON.parse(payment.metadata) : null;

  if (!metadata) {
    console.error(`❌ Payment metadata not found: ${payment.id}`);
    return;
  }

  const tier = metadata.tier as SubscriptionTier;
  const planName = metadata.planName as string;
  const monthlyModerationCredits = metadata.monthlyModerationCredits as number;
  const monthlyFaqCredits = metadata.monthlyFaqCredits as number;
  const months = (metadata.months as number) || 1;

  // Calculate period dates
  const now = new Date();
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + months);

  // Calculate next usage reset date
  const usageResetDate = getNextResetDate();

  // Update subscription
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
      // Legacy fields
      monthlyCommentLimit: monthlyModerationCredits,
      currentMonthUsage: 0,
      usageResetDate,
      expiresAt: currentPeriodEnd,
      notchpayCustomerEmail: transaction.customer.email,
      notchpayCustomerPhone: transaction.customer.phone || null,
      updatedAt: new Date(),
    },
  });

  // Refill user credits
  const creditRefill = await refillMonthlyCredits(
    payment.subscription.userId,
    updatedSubscription
  );

  console.log(`💳 Credits refilled: ${creditRefill.creditsAdded} total credits added`);

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ NotchPay payment completed for user ${payment.subscription.userId} - ${months} month(s) of ${planName}`
  );
}

async function handlePaymentFailed(payload: NotchPayWebhookPayload) {
  const { transaction } = payload;
  const reference = transaction.reference;

  console.log(`🔍 Processing NotchPay payment failed: ${reference}`);

  // Find the payment
  const payment = await prisma.payment.findFirst({
    where: {
      notchpayTransactionId: reference,
      paymentProvider: 'NOTCHPAY',
    },
  });

  if (!payment) {
    console.error(`❌ Payment not found for reference: ${reference}`);
    return;
  }

  // If already failed, skip
  if (payment.status === 'FAILED') {
    console.log(`ℹ️  Payment already marked as failed: ${reference}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      updatedAt: new Date(),
    },
  });

  console.log(`❌ NotchPay payment failed for reference ${reference}`);
}
