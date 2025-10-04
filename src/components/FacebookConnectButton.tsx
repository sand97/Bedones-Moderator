import { FacebookIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { useToast } from '~/hooks/use-toast';
import { authClient } from '~/lib/auth-client';
import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(() => {
    // Check if OAuth is in progress from sessionStorage
    return sessionStorage.getItem('facebookOAuthInProgress') === 'true';
  });

  useEffect(() => {
    // Clear the OAuth in progress flag on mount (in case of error/cancellation)
    const clearFlag = () => {
      sessionStorage.removeItem('facebookOAuthInProgress');
    };

    // Clear on visibility change (user comes back to tab)
    document.addEventListener('visibilitychange', clearFlag);

    return () => {
      document.removeEventListener('visibilitychange', clearFlag);
    };
  }, []);

  const handleClick = async () => {
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

    setLoading(true);
    // Set flag in sessionStorage to persist loading state across remounts
    sessionStorage.setItem('facebookOAuthInProgress', 'true');

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

    // Use Better Auth client to initiate Facebook OAuth
    try {
      await authClient.signIn.social({
        provider: 'facebook',
        callbackURL: '/dashboard',
        scopes: [
          'pages_show_list',
          'pages_read_user_content',
          'pages_manage_engagement',
          'pages_read_engagement',
          'pages_manage_posts',
          'pages_messaging',
        ],
      });
    } catch (error) {
      console.error('Facebook OAuth failed:', error);
      // Clear the flag on error
      sessionStorage.removeItem('facebookOAuthInProgress');
      setLoading(false);
    }
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
