import crypto from 'crypto';
import { PLAN_CONFIGS, calculateMultiMonthPrice } from './subscription-utils';
import type { SubscriptionTier } from '@prisma/client';

const NOTCHPAY_API_URL = 'https://api.notchpay.co';

// Types
export interface NotchPayPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  reference: string;
  description: string;
  callback: string;
}

export interface NotchPayPaymentResponse {
  transaction: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
  authorization_url: string;
}

export interface NotchPayVerifyResponse {
  transaction: {
    reference: string;
    status: string; // 'pending', 'complete', 'failed', 'cancelled'
    amount: number;
    currency: string;
    customer: {
      email: string;
      phone?: string;
    };
    metadata?: Record<string, string>;
  };
}

export interface NotchPayWebhookPayload {
  event: string; // 'payment.complete', 'payment.failed'
  transaction: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      phone?: string;
    };
    metadata?: Record<string, string>;
  };
}

/**
 * Create a NotchPay payment
 */
export async function createNotchPayPayment(
  data: NotchPayPaymentRequest
): Promise<NotchPayPaymentResponse> {
  const publicKey = process.env.NOTCH_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('NOTCH_PUBLIC_KEY is not configured');
  }

  const response = await fetch(`${NOTCHPAY_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: publicKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NotchPay API error: ${error}`);
  }

  return response.json();
}

/**
 * Verify a NotchPay payment by reference
 */
export async function verifyNotchPayPayment(
  reference: string
): Promise<NotchPayVerifyResponse> {
  const publicKey = process.env.NOTCH_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('NOTCH_PUBLIC_KEY is not configured');
  }

  const response = await fetch(
    `${NOTCHPAY_API_URL}/payments/${reference}`,
    {
      method: 'GET',
      headers: {
        Authorization: publicKey,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NotchPay verify error: ${error}`);
  }

  return response.json();
}

/**
 * Verify NotchPay webhook signature
 */
export function verifyNotchPaySignature(
  payload: string,
  signature: string
): boolean {
  const hashKey = process.env.NOTCH_HASH_KEY;

  if (!hashKey) {
    throw new Error('NOTCH_HASH_KEY is not configured');
  }

  const calculatedSignature = crypto
    .createHmac('sha256', hashKey)
    .update(payload)
    .digest('hex');

  return signature === calculatedSignature;
}

/**
 * Get plan amount in XAF (FCFA) - Legacy function
 */
export function getNotchPayAmount(planKey: string): number {
  const plan = PLAN_CONFIGS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }
  return plan.price.monthlyXaf;
}

/**
 * Get plan amount with multi-month discount
 */
export function getNotchPayMultiMonthAmount(
  planKey: string,
  months: 1 | 3 | 6 | 12
): {
  basePrice: number;
  totalBase: number;
  discount: number;
  discountAmount: number;
  finalPrice: number;
  months: number;
} {
  const pricing = calculateMultiMonthPrice(planKey, months, 'XAF');

  return {
    ...pricing,
    months,
  };
}

/**
 * Get plan configuration for NotchPay
 */
export function getNotchPayPlanConfig(planKey: string): {
  tier: SubscriptionTier;
  monthlyModerationCredits: number;
  monthlyFaqCredits: number;
  priceXaf: number;
  priceUsd: number;
  name: string;
} {
  const plan = PLAN_CONFIGS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }
  return {
    tier: plan.tier,
    monthlyModerationCredits: plan.monthlyModerationCredits,
    monthlyFaqCredits: plan.monthlyFaqCredits,
    priceXaf: plan.price.monthlyXaf,
    priceUsd: plan.price.monthlyUsd,
    name: plan.name,
  };
}
