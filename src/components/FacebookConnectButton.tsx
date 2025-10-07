import { FacebookIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { useToast } from '~/hooks/use-toast';
import { useAuth } from '~/hooks/useAuth';
import { cn } from '~/lib/utils';
import type { FAQItem } from './IntelligentFAQSection';

interface FacebookConnectButtonProps {
  undesiredCommentsEnabled: boolean;
  undesiredCommentsAction: 'hide' | 'delete';
  spamDetectionEnabled: boolean;
  spamAction: 'hide' | 'delete';
  intelligentFAQEnabled: boolean;
  faqItems: FAQItem[];
}

export function FacebookConnectButton({
  undesiredCommentsEnabled,
  undesiredCommentsAction,
  spamDetectionEnabled,
  spamAction,
  intelligentFAQEnabled,
  faqItems,
}: FacebookConnectButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { loading, signIn } = useAuth();

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

    // Use custom auth client to initiate Facebook OAuth
    signIn();
  };

  return (
    <div className="text-center">
      <Button
        disabled={loading}
        onClick={handleClick}
        className={cn(
          'bg-black hover:bg-gray-800 text-white border border-gray-300 px-8 py-6 text-base rounded-full',
          { 'opacity-50': loading },
        )}
      >
        <span className="mr-2 h-6 w-6 bg-white rounded-full text-black flex items-center justify-center">
          <FacebookIcon className="h-4 w-4 fill-black stroke-transparent" />
        </span>
        {t('facebook.continue')}
      </Button>
      <p className="text-xs text-gray-500 mt-3">{t('facebook.disclaimer')}</p>
    </div>
  );
}
