import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { signInWithInstagram } from '~/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useToast } from '~/hooks/use-toast';
import { DashboardLayout } from '~/components/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Separator } from '~/components/ui/separator';
import { Skeleton } from '~/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { UndesiredCommentsSection } from '~/components/UndesiredCommentsSection';
import { SpamDetectionSection } from '~/components/SpamDetectionSection';
import {
  IntelligentFAQSection,
  type FAQItem,
} from '~/components/IntelligentFAQSection';

const InstagramPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: allAccounts, isLoading: accountsLoading } =
    trpc.auth.getInstagramAccounts.useQuery(undefined, {
      enabled: !!session?.user,
    });

  // Filter to show only Instagram accounts
  const accounts = allAccounts?.filter((account) => account.provider === 'INSTAGRAM');

  const utils = trpc.useUtils();

  const _reconnectAccounts = trpc.auth.autoSyncInstagramAccounts.useMutation({
    onSuccess: () => {
      toast({
        title: t('instagram.accountSettings.accountsRefreshed'),
      });
      utils.auth.getInstagramAccounts.invalidate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('instagram.accountSettings.refreshFailed'),
        description: error.message,
      });
    },
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!sessionLoading && !session?.user) {
      router.push('/');
      return;
    }

    // Clear localStorage if update is disabled (for existing users reconnecting)
    const updateDisabled = router.query.update === 'disabled';
    if (updateDisabled) {
      localStorage.removeItem('moderationSettings');
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading || accountsLoading) {
    return (
      <DashboardLayout pageTitle="Instagram">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-6 pt-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout
      pageTitle={t('instagram.accountSettings.title')}
      headerRight={
        <button
          onClick={() => signInWithInstagram()}
          className="inline-flex items-center gap-2 rounded-md border border-transparent bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">
            {t('instagram.accountSettings.addAccount')}
          </span>
        </button>
      }
    >
      {accounts?.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              {t('instagram.accountSettings.noAccountsFound')}
            </p>
          </CardContent>
        </Card>
      )}

      {accounts && accounts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

interface AccountCardProps {
  account: any;
}

function AccountCard({ account }: AccountCardProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const locale = i18n.language === 'fr' ? fr : enUS;

  // Local state for account settings
  const [undesiredCommentsEnabled, setUndesiredCommentsEnabled] = useState(
    account.settings?.undesiredCommentsEnabled || false,
  );
  const [undesiredCommentsAction, setUndesiredCommentsAction] = useState<
    'hide' | 'delete'
  >((account.settings?.undesiredCommentsAction as 'hide' | 'delete') || 'hide');

  const [spamDetectionEnabled, setSpamDetectionEnabled] = useState(
    account.settings?.spamDetectionEnabled || false,
  );
  const [spamAction, setSpamAction] = useState<'hide' | 'delete'>(
    (account.settings?.spamAction as 'hide' | 'delete') || 'delete',
  );

  const [intelligentFAQEnabled, setIntelligentFAQEnabled] = useState(
    account.settings?.intelligentFAQEnabled || false,
  );
  const [faqItems, setFaqItems] = useState<FAQItem[]>(
    account.settings?.faqRules?.map((rule: any) => ({
      id: rule.id,
      assertion: rule.assertion,
      response: rule.response,
    })) || [],
  );

  // Sync state when account data changes
  useEffect(() => {
    setUndesiredCommentsEnabled(
      account.settings?.undesiredCommentsEnabled || false,
    );
    setUndesiredCommentsAction(
      (account.settings?.undesiredCommentsAction as 'hide' | 'delete') ||
        'hide',
    );
    setSpamDetectionEnabled(account.settings?.spamDetectionEnabled || false);
    setSpamAction(
      (account.settings?.spamAction as 'hide' | 'delete') || 'delete',
    );
    setIntelligentFAQEnabled(account.settings?.intelligentFAQEnabled || false);
    setFaqItems(
      account.settings?.faqRules?.map((rule: any) => ({
        id: rule.id,
        assertion: rule.assertion,
        response: rule.response,
      })) || [],
    );
  }, [account.settings]);

  const updateSettings = trpc.auth.updateInstagramAccountSettings.useMutation({
    onSuccess: () => {
      toast({
        title: t('instagram.accountSettings.settingsUpdated'),
      });
      utils.auth.getInstagramAccounts.invalidate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('instagram.accountSettings.settingsUpdateFailed'),
        description: error.message,
      });
    },
  });

  const addFAQRule = trpc.auth.addInstagramFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getInstagramAccounts.invalidate();
    },
  });

  const updateFAQRule = trpc.auth.updateInstagramFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getInstagramAccounts.invalidate();
    },
  });

  const deleteFAQRule = trpc.auth.deleteInstagramFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getInstagramAccounts.invalidate();
    },
  });

  const handleUndesiredCommentsEnabledChange = (enabled: boolean) => {
    setUndesiredCommentsEnabled(enabled);
    updateSettings.mutate({
      accountId: account.id,
      undesiredCommentsEnabled: enabled,
    });
  };

  const handleUndesiredCommentsActionChange = (action: 'hide' | 'delete') => {
    setUndesiredCommentsAction(action);
    updateSettings.mutate({
      accountId: account.id,
      undesiredCommentsAction: action,
    });
  };

  const handleSpamDetectionEnabledChange = (enabled: boolean) => {
    setSpamDetectionEnabled(enabled);
    updateSettings.mutate({
      accountId: account.id,
      spamDetectionEnabled: enabled,
    });
  };

  const handleSpamActionChange = (action: 'hide' | 'delete') => {
    setSpamAction(action);
    updateSettings.mutate({
      accountId: account.id,
      spamAction: action,
    });
  };

  const handleIntelligentFAQEnabledChange = (enabled: boolean) => {
    setIntelligentFAQEnabled(enabled);
    updateSettings.mutate({
      accountId: account.id,
      intelligentFAQEnabled: enabled,
    });
  };

  const handleFaqItemsChange = (items: FAQItem[]) => {
    const oldItems = faqItems;
    const newItems = items;

    // Find added items
    const added = newItems.filter(
      (newItem) => !oldItems.find((old) => old.id === newItem.id),
    );

    // Find removed items
    const removed = oldItems.filter(
      (oldItem) => !newItems.find((newItem) => newItem.id === oldItem.id),
    );

    // Find edited items
    const edited = newItems.filter((newItem) => {
      const oldItem = oldItems.find((old) => old.id === newItem.id);
      return (
        oldItem &&
        (oldItem.assertion !== newItem.assertion ||
          oldItem.response !== newItem.response)
      );
    });

    // Update local state immediately
    setFaqItems(items);

    // Add new rules to database
    added.forEach((item) => {
      addFAQRule.mutate({
        accountId: account.id,
        assertion: item.assertion,
        response: item.response,
      });
    });

    // Delete removed rules from database
    removed.forEach((item) => {
      deleteFAQRule.mutate({
        ruleId: item.id,
      });
    });

    // Update edited rules in database
    edited.forEach((item) => {
      updateFAQRule.mutate({
        ruleId: item.id,
        assertion: item.assertion,
        response: item.response,
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={account.profilePictureUrl || undefined}
              alt={account.username}
            />
            <AvatarFallback>
              {account.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="mb-1">@{account.username}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('instagram.accountSettings.addedAgo', {
                time: formatDistanceToNow(new Date(account.createdAt), {
                  locale,
                }),
              })}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6 pt-6">
        <UndesiredCommentsSection
          enabled={undesiredCommentsEnabled}
          onEnabledChange={handleUndesiredCommentsEnabledChange}
          action={undesiredCommentsAction}
          onActionChange={handleUndesiredCommentsActionChange}
          idPrefix={`${account.id}-`}
        />

        <SpamDetectionSection
          enabled={spamDetectionEnabled}
          onEnabledChange={handleSpamDetectionEnabledChange}
          action={spamAction}
          onActionChange={handleSpamActionChange}
          idPrefix={`${account.id}-`}
        />

        <IntelligentFAQSection
          enabled={intelligentFAQEnabled}
          onEnabledChange={handleIntelligentFAQEnabledChange}
          faqItems={faqItems}
          onFaqItemsChange={handleFaqItemsChange}
          idPrefix={`${account.id}-`}
        />
      </CardContent>
    </Card>
  );
}

export default InstagramPage;
