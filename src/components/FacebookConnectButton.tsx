import { FacebookIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { useToast } from '~/hooks/use-toast';
import { authClient } from '~/lib/auth-client';

interface FacebookConnectButtonProps {
  undesiredCommentsEnabled: boolean;
  spamDetectionEnabled: boolean;
  intelligentFAQEnabled: boolean;
}

export function FacebookConnectButton({
  undesiredCommentsEnabled,
  spamDetectionEnabled,
  intelligentFAQEnabled,
}: FacebookConnectButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

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

    // Save settings to localStorage to restore after OAuth redirect
    localStorage.setItem(
      'moderationSettings',
      JSON.stringify({
        undesiredCommentsEnabled,
        undesiredCommentsAction: 'hide', // Will be updated to get from parent
        spamDetectionEnabled,
        spamAction: 'delete', // Will be updated to get from parent
        intelligentFAQEnabled,
      }),
    );

    // Use Better Auth client to initiate Facebook OAuth
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
  };

  return (
    <div className="text-center">
      <Button
        onClick={handleClick}
        className="bg-black hover:bg-gray-800 text-white border border-gray-300 px-8 py-6 text-base rounded-full"
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
