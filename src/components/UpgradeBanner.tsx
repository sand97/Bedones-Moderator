import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { trpc } from '~/utils/trpc';
import { Button } from '~/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

const DISMISSED_KEY = 'upgradeBannerDismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Critical thresholds
const CRITICAL_MODERATION_THRESHOLD = 20;
const CRITICAL_FAQ_THRESHOLD = 2;

export function UpgradeBanner() {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch current subscription data
  const { data: currentData, isLoading } = trpc.subscription.getCurrent.useQuery();

  // Check if banner was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      try {
        const { timestamp } = JSON.parse(dismissed);
        const now = Date.now();
        // Check if 7 days have passed
        if (now - timestamp < DISMISS_DURATION) {
          setIsDismissed(true);
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem(DISMISSED_KEY);
        }
      } catch {
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify({ dismissed: true, timestamp: Date.now() }),
    );
    setIsDismissed(true);
  };

  // Don't show while loading to avoid flash
  if (isLoading || !currentData) {
    return null;
  }

  // Get user tier
  const userTier = currentData.subscription?.tier || 'FREE';

  // Don't show if not FREE plan
  if (userTier !== 'FREE') {
    return null;
  }

  // Get remaining credits
  const moderationCredits = currentData?.creditsInfo?.moderationCredits || 0;
  const faqCredits = currentData?.creditsInfo?.faqCredits || 0;

  // Check if critical (very low credits)
  const isCritical =
    moderationCredits <= CRITICAL_MODERATION_THRESHOLD ||
    faqCredits <= CRITICAL_FAQ_THRESHOLD;

  // If dismissed and not critical, don't show
  if (isDismissed && !isCritical) {
    return null;
  }

  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 ${
        isCritical
          ? 'bg-red-600 text-white'
          : 'bg-black text-white'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isCritical && <AlertTriangle className="size-5 shrink-0" />}
        <p className="text-sm">
          {isCritical ? (
            <>
              {t('upgradeBanner.critical.message', {
                moderationLeft: moderationCredits,
                faqLeft: faqCredits,
              })}
            </>
          ) : (
            <>
              {t('upgradeBanner.normal.message', {
                moderationLeft: moderationCredits,
                faqLeft: faqCredits,
              })}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/payment-method">
          <Button
            size="sm"
            className={
              isCritical
                ? 'bg-white text-red-600 hover:bg-gray-100'
                : 'bg-white text-black hover:bg-gray-200'
            }
          >
            {isCritical
              ? t('upgradeBanner.critical.cta')
              : t('upgradeBanner.normal.cta')}
          </Button>
        </Link>
        {!isCritical && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="size-8 text-white hover:bg-white/20"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
