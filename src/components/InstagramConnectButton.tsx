import { Instagram } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from '~/components/ui/button';
import { useToast } from '~/hooks/use-toast';
import { signInWithInstagram } from '~/lib/auth-client';
import { cn } from '~/lib/utils';
import type { FAQItem } from './IntelligentFAQSection';

interface InstagramConnectButtonProps {
  undesiredCommentsEnabled: boolean;
  undesiredCommentsAction: 'hide' | 'delete';
  spamDetectionEnabled: boolean;
  spamAction: 'hide' | 'delete';
  intelligentFAQEnabled: boolean;
  faqItems: FAQItem[];
}

export function InstagramConnectButton({
  undesiredCommentsEnabled,
  undesiredCommentsAction,
  spamDetectionEnabled,
  spamAction,
  intelligentFAQEnabled,
  faqItems,
}: InstagramConnectButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (
      !undesiredCommentsEnabled &&
      !spamDetectionEnabled &&
      !intelligentFAQEnabled
    ) {
      toast({
        variant: 'destructive',
        title: t('validation.atLeastOneFeature'),
      });
      return;
    }

    // Save settings to localStorage to restore after OAuth redirect
    localStorage.setItem(
      'moderationSettings',
      JSON.stringify({
        undesiredCommentsEnabled,
        undesiredCommentsAction,
        spamDetectionEnabled,
        spamAction,
        intelligentFAQEnabled,
        faqItems,
      }),
    );

    // Save current locale to localStorage to preserve language preference after login
    const currentLocale = router.locale || 'fr';
    localStorage.setItem('preferredLocale', currentLocale);

    setLoading(true);
    // Use custom auth client to initiate Instagram OAuth
    signInWithInstagram();
  };

  return (
    <Button
      disabled={loading}
      onClick={handleClick}
      variant="outline"
      className={cn(
        'w-full border border-border hover:bg-secondary px-8 py-6 text-base rounded-full',
        { 'opacity-50': loading },
      )}
    >
      <Instagram className="mr-2 h-5 w-5" />
      {t('instagram.continue')}
    </Button>
  );
}
