'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackPurchase } from '~/lib/analytics';
import { trpc } from '~/utils/trpc';

/**
 * Component that tracks successful purchases in Google Analytics
 * when user returns from payment gateway
 */
export function PurchaseTracker() {
  const router = useRouter();
  const hasTrackedRef = useRef(false);

  // Get the most recent completed payment
  const { data: historyData } = trpc.subscription.getPaymentHistory.useQuery(
    {
      limit: 1,
      offset: 0,
    },
    {
      enabled: router.query.payment === 'success' && !hasTrackedRef.current,
    }
  );

  useEffect(() => {
    // Only track if payment was successful and we haven't tracked yet
    if (
      router.query.payment === 'success' &&
      !hasTrackedRef.current &&
      historyData?.payments?.[0]
    ) {
      const payment = historyData.payments[0];

      // Only track completed payments
      if (payment.status === 'COMPLETED') {
        const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

        trackPurchase({
          transaction_id: payment.id,
          value: payment.amount / (payment.currency === 'USD' ? 100 : 1),
          currency: payment.currency,
          items: [
            {
              item_id: metadata.tier || 'unknown',
              item_name: metadata.planName || 'Subscription',
              price: payment.amount / (payment.currency === 'USD' ? 100 : 1),
              quantity: payment.monthsPurchased || 1,
              item_category: 'subscription',
            },
          ],
          payment_type: payment.paymentProvider === 'STRIPE' ? 'stripe' : 'notchpay',
        });

        hasTrackedRef.current = true;

        // Clean up URL by removing the payment query param
        const { payment: _, ...restQuery } = router.query;
        router.replace(
          {
            pathname: router.pathname,
            query: restQuery,
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [router, historyData]);

  return null;
}
