import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { prisma } from '~/server/prisma.ts';
import { PLAN_CONFIGS } from '~/lib/subscription-utils.ts';
import type { SubscriptionTier } from '@prisma/client';
import { rateLimit, RateLimitPresets } from '~/lib/rate-limit.ts';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Mapping des plans aux tiers
const PLAN_TO_TIER: Record<string, SubscriptionTier> = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting: Standard limit for checkout (30 requests per minute)
  if (!rateLimit(req, res, RateLimitPresets.STANDARD)) {
    return; // Response already sent
  }

  try {
    // Get session token from cookies
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

    const { planKey } = req.body;

    if (!planKey || typeof planKey !== 'string' || !PLAN_TO_TIER[planKey]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const tier = PLAN_TO_TIER[planKey];
    const planConfig = PLAN_CONFIGS[planKey];

    // Validate that Stripe price ID is configured
    if (!planConfig.stripePriceId) {
      console.error('Stripe price ID not configured for plan:', planKey);
      return res.status(500).json({
        error: 'Stripe price not configured for this plan. Please contact support.'
      });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      include: { subscription: true },
    });

    if (!user?.email) {
      console.error('User not found or has no email during checkout:', sessionData.userId);
      return res.status(404).json({ error: 'User not found or has no email' });
    }

    console.log('Creating checkout for user:', user.id, user.email);

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Use pre-configured Stripe price ID
    const priceId = planConfig.stripePriceId;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      locale: 'fr', // French interface
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/payment-method?payment=cancelled`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planKey,
          tier,
          planName: planConfig.name,
          monthlyModerationCredits: String(planConfig.monthlyModerationCredits),
          monthlyFaqCredits: String(planConfig.monthlyFaqCredits),
          userEmail: user.email || '',
        },
      },
    });

    console.log('Checkout session created:', checkoutSession.id);
    console.log('Metadata:', checkoutSession.metadata);

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
