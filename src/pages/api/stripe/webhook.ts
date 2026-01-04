import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '../../../server/prisma';
import { getNextResetDate } from '../../../lib/subscription-utils';
import type { SubscriptionTier } from '@prisma/client';
import { rateLimit, RateLimitPresets } from '../../../lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable bodyParser for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: High limit for webhooks (1000 requests per minute)
  if (!rateLimit(req, res, RateLimitPresets.WEBHOOK)) {
    return; // Response already sent
  }

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🔍 Processing checkout.session.completed:', session.id);
  console.log('📦 Session metadata:', session.metadata);
  console.log('💰 Payment status:', session.payment_status);
  console.log('👤 Customer:', session.customer);

  let userId = session.metadata?.userId;
  const tier = session.metadata?.tier as SubscriptionTier;
  const planName = session.metadata?.planName;
  const monthlyCommentLimit = parseInt(session.metadata?.monthlyCommentLimit || '1000', 10);

  if (!userId || !tier || !planName) {
    console.error('❌ Missing metadata in checkout session:', session.id);
    console.error('   userId:', userId);
    console.error('   tier:', tier);
    console.error('   planName:', planName);
    throw new Error('Missing required metadata in checkout session');
  }

  console.log(`✅ Creating subscription for user ${userId} with plan ${planName}`);

  // Verify user exists
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Fallback: if user doesn't exist with this ID, try to find by customer email
  if (!user && session.customer) {
    console.warn(`⚠️  User not found with ID: ${userId}, trying to find by customer email...`);

    try {
      const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;

      if (customer.email) {
        console.log(`   Looking for user with email: ${customer.email}`);
        user = await prisma.user.findUnique({
          where: { email: customer.email },
        });

        if (user) {
          console.log(`✅ Found user by email! Updating userId to: ${user.id}`);
          userId = user.id;
        }
      }
    } catch (error) {
      console.error('   Error retrieving customer:', error);
    }
  }

  if (!user) {
    console.error(`❌ User not found with ID: ${userId}`);
    throw new Error(`User not found: ${userId}`);
  }

  console.log(`✅ User found: ${user.email} (${user.id})`);

  // Calculate expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Calculate next usage reset date (first day of next month)
  const usageResetDate = getNextResetDate();

  // Create or update subscription
  try {
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        planName,
        stripeCustomerId: session.customer as string,
        stripePriceId: session.metadata?.priceId || null,
        stripeProductId: process.env.STRIPE_PRODUCT_ID || null,
        monthlyCommentLimit,
        currentMonthUsage: 0, // Reset usage on new subscription
        usageResetDate,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        userId,
        tier,
        planName,
        stripeCustomerId: session.customer as string,
        stripePriceId: session.metadata?.priceId || null,
        stripeProductId: process.env.STRIPE_PRODUCT_ID || null,
        monthlyCommentLimit,
        currentMonthUsage: 0,
        usageResetDate,
        expiresAt,
      },
    });

    console.log(`✅ Subscription created/updated successfully!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Plan: ${planName} (${tier})`);
    console.log(`   Monthly limit: ${monthlyCommentLimit} comments`);
    console.log(`   Expires: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error('❌ Error creating/updating subscription:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const customerId = paymentIntent.customer as string;

  if (!customerId) {
    console.error('❌ No customer ID in payment intent:', paymentIntent.id);
    return;
  }

  // Get subscription via customer ID
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    console.error('❌ No subscription found for customer:', customerId);
    return;
  }

  // Create payment record
  try {
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'COMPLETED',
        paymentProvider: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: paymentIntent.latest_charge as string,
      },
    });

    console.log(`✅ Payment recorded for subscription ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error recording payment:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const customerId = paymentIntent.customer as string;

  if (!customerId) {
    console.warn('⚠️  No customer ID in failed payment intent:', paymentIntent.id);
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    console.warn('⚠️  No subscription found for customer:', customerId);
    return;
  }

  // Create failed payment record
  try {
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'FAILED',
        paymentProvider: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    console.log(`❌ Payment failed recorded for subscription ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error recording failed payment:', error);
    throw error;
  }
}
