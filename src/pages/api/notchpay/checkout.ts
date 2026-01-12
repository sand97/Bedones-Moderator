import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../server/prisma';
import {
  createNotchPayPayment,
  getNotchPayMultiMonthAmount,
  getNotchPayPlanConfig,
} from '../../../lib/notchpay-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    const { planKey, months = 1 } = req.body;

    if (!planKey) {
      return res.status(400).json({ error: 'Plan key is required' });
    }

    // Validate months (must be 1, 3, 6, or 12)
    if (![1, 3, 6, 12].includes(months)) {
      return res.status(400).json({ error: 'Invalid months value. Must be 1, 3, 6, or 12' });
    }

    const user = sessionData.user;

    if (!user.email) {
      return res.status(400).json({ error: 'User email not found' });
    }

    // Get plan configuration
    const planConfig = getNotchPayPlanConfig(planKey);
    const pricing = getNotchPayMultiMonthAmount(planKey, months as 1 | 3 | 6 | 12);

    // Generate a unique reference for this payment
    const reference = `moderateur_${user.id}_${Date.now()}`;

    // Prepare callback URL - redirect to backend API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/notchpay/callback?reference=${reference}`;

    // Build description with discount info
    let description = `Moderateur Bedones ${planConfig.name} - ${months} mois`;
    if (pricing.discount > 0) {
      description += ` (${pricing.discount}% de réduction)`;
    }

    // Create NotchPay payment
    const payment = await createNotchPayPayment({
      amount: Math.round(pricing.finalPrice), // Round to avoid decimal issues
      currency: 'XAF',
      email: user.email,
      reference,
      description,
      callback: callbackUrl,
    });

    // Store pending payment metadata in database
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        notchpayCustomerEmail: user.email,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        tier: 'FREE', // Will be updated on payment success
        notchpayCustomerEmail: user.email,
      },
    });

    // Create a pending payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: pricing.finalPrice,
        currency: 'XAF',
        status: 'PENDING',
        paymentProvider: 'NOTCHPAY',
        notchpayTransactionId: reference,
        notchpayReference: reference,
        monthsPurchased: months,
        discountPercentage: pricing.discount,
        baseAmount: pricing.totalBase,
        metadata: JSON.stringify({
          planKey,
          tier: planConfig.tier,
          planName: planConfig.name,
          monthlyModerationCredits: planConfig.monthlyModerationCredits,
          monthlyFaqCredits: planConfig.monthlyFaqCredits,
          months,
          discount: pricing.discount,
          basePrice: pricing.basePrice,
          totalBase: pricing.totalBase,
          discountAmount: pricing.discountAmount,
        }),
      },
    });

    // Return the authorization URL for redirect
    return res.status(200).json({
      url: payment.authorization_url,
      reference: payment.transaction.reference,
      pricing: {
        basePrice: pricing.basePrice,
        months,
        totalBase: pricing.totalBase,
        discount: pricing.discount,
        discountAmount: pricing.discountAmount,
        finalPrice: pricing.finalPrice,
      },
    });
  } catch (error) {
    console.error('NotchPay checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
