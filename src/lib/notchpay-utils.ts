import crypto from 'crypto';
import { PLAN_CONFIGS } from './subscription-utils';
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
 * Get plan amount in XAF (FCFA)
 */
export function getNotchPayAmount(planKey: string): number {
  const plan = PLAN_CONFIGS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }
  return plan.price.monthly;
}

/**
 * Get plan configuration for NotchPay
 */
export function getNotchPayPlanConfig(planKey: string): {
  tier: SubscriptionTier;
  monthlyCommentLimit: number;
  priceXaf: number;
  name: string;
} {
  const plan = PLAN_CONFIGS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }
  return {
    tier: plan.tier,
    monthlyCommentLimit: plan.monthlyCommentLimit,
    priceXaf: plan.price.monthly,
    name: plan.name,
  };
}
