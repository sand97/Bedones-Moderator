/**
 * Google Analytics utility functions
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-ZEJZ4EPXE9';

/**
 * Identify a user in Google Analytics
 * @param userId - The user ID to identify
 */
export function identifyUser(userId: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
}

/**
 * Clear the user identification in Google Analytics
 */
export function clearUser(): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: null,
    });
  }
}

/**
 * E-commerce tracking types
 */
interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

interface BeginCheckoutParams {
  currency: string;
  value: number;
  items: EcommerceItem[];
  payment_type?: string;
}

interface PurchaseParams {
  transaction_id: string;
  value: number;
  currency: string;
  items: EcommerceItem[];
  payment_type?: string;
}

/**
 * Track when a user begins the checkout process
 * @param params - Checkout parameters
 */
export function trackBeginCheckout(params: BeginCheckoutParams): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: params.currency,
        value: params.value,
        items: params.items,
        payment_type: params.payment_type,
      });
    }
  } catch (error) {
    // Ne jamais faire crasher l'application pour un problème de tracking
    console.error('Error tracking begin_checkout:', error);
  }
}

/**
 * Track a completed purchase
 * @param params - Purchase parameters
 */
export function trackPurchase(params: PurchaseParams): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: params.transaction_id,
        value: params.value,
        currency: params.currency,
        items: params.items,
        payment_type: params.payment_type,
      });
    }
  } catch (error) {
    // Ne jamais faire crasher l'application pour un problème de tracking
    console.error('Error tracking purchase:', error);
  }
}

/**
 * Track custom events
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
}

/**
 * Track page views
 * @param url - Page URL
 * @param title - Page title
 */
export function trackPageView(url: string, title?: string): void {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title,
      });
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}
