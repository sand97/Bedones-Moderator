import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { signIn } from '~/lib/auth-client';
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

const FacebookPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: allPages, isLoading: pagesLoading } = trpc.auth.getPages.useQuery(
    undefined,
    {
      enabled: !!session?.user,
    },
  );

  // Filter to show only Facebook pages
  const pages = allPages?.filter((page) => page.provider === 'FACEBOOK');

  const utils = trpc.useUtils();

  const _reconnectPages = trpc.auth.autoSyncFacebookPages.useMutation({
    onSuccess: () => {
      toast({
        title: t('facebook.pageSettings.pagesRefreshed'),
      });
      utils.auth.getPages.invalidate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('facebook.pageSettings.refreshFailed'),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading, router.query.update]);

  if (sessionLoading || pagesLoading) {
    return (
      <DashboardLayout pageTitle="Facebook">
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
    <DashboardLayout pageTitle={t('facebook.pageSettings.title')}>
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => signIn()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          {t('facebook.pageSettings.addPage')}
        </button>
      </div>

      {pages?.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              {t('facebook.pageSettings.noPagesFound')}
            </p>
          </CardContent>
        </Card>
      )}

      {pages && pages.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((page) => (
            <PageCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

interface PageCardProps {
  page: any;
}

function PageCard({ page }: PageCardProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const locale = i18n.language === 'fr' ? fr : enUS;

  // Local state for page settings
  const [undesiredCommentsEnabled, setUndesiredCommentsEnabled] = useState(
    page.settings?.undesiredCommentsEnabled || false,
  );
  const [undesiredCommentsAction, setUndesiredCommentsAction] = useState<
    'hide' | 'delete'
  >((page.settings?.undesiredCommentsAction as 'hide' | 'delete') || 'hide');

  const [spamDetectionEnabled, setSpamDetectionEnabled] = useState(
    page.settings?.spamDetectionEnabled || false,
  );
  const [spamAction, setSpamAction] = useState<'hide' | 'delete'>(
    (page.settings?.spamAction as 'hide' | 'delete') || 'delete',
  );

  const [intelligentFAQEnabled, setIntelligentFAQEnabled] = useState(
    page.settings?.intelligentFAQEnabled || false,
  );
  const [faqItems, setFaqItems] = useState<FAQItem[]>(
    page.settings?.faqRules?.map((rule: any) => ({
      id: rule.id,
      assertion: rule.assertion,
      response: rule.response,
    })) || [],
  );

  // Sync state when page data changes
  useEffect(() => {
    setUndesiredCommentsEnabled(
      page.settings?.undesiredCommentsEnabled || false,
    );
    setUndesiredCommentsAction(
      (page.settings?.undesiredCommentsAction as 'hide' | 'delete') || 'hide',
    );
    setSpamDetectionEnabled(page.settings?.spamDetectionEnabled || false);
    setSpamAction((page.settings?.spamAction as 'hide' | 'delete') || 'delete');
    setIntelligentFAQEnabled(page.settings?.intelligentFAQEnabled || false);
    setFaqItems(
      page.settings?.faqRules?.map((rule: any) => ({
        id: rule.id,
        assertion: rule.assertion,
        response: rule.response,
      })) || [],
    );
  }, [page.settings]);

  const updateSettings = trpc.auth.updatePageSettings.useMutation({
    onSuccess: () => {
      toast({
        title: t('facebook.pageSettings.settingsUpdated'),
      });
      utils.auth.getPages.invalidate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('facebook.pageSettings.settingsUpdateFailed'),
        description: error.message,
      });
    },
  });

  const addFAQRule = trpc.auth.addFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getPages.invalidate();
    },
  });

  const updateFAQRule = trpc.auth.updateFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getPages.invalidate();
    },
  });

  const deleteFAQRule = trpc.auth.deleteFAQRule.useMutation({
    onSuccess: () => {
      utils.auth.getPages.invalidate();
    },
  });

  const handleUndesiredCommentsEnabledChange = (enabled: boolean) => {
    setUndesiredCommentsEnabled(enabled);
    updateSettings.mutate({
      pageId: page.id,
      undesiredCommentsEnabled: enabled,
    });
  };

  const handleUndesiredCommentsActionChange = (action: 'hide' | 'delete') => {
    setUndesiredCommentsAction(action);
    updateSettings.mutate({
      pageId: page.id,
      undesiredCommentsAction: action,
    });
  };

  const handleSpamDetectionEnabledChange = (enabled: boolean) => {
    setSpamDetectionEnabled(enabled);
    updateSettings.mutate({
      pageId: page.id,
      spamDetectionEnabled: enabled,
    });
  };

  const handleSpamActionChange = (action: 'hide' | 'delete') => {
    setSpamAction(action);
    updateSettings.mutate({
      pageId: page.id,
      spamAction: action,
    });
  };

  const handleIntelligentFAQEnabledChange = (enabled: boolean) => {
    setIntelligentFAQEnabled(enabled);
    updateSettings.mutate({
      pageId: page.id,
      intelligentFAQEnabled: enabled,
    });
  };

  const handleFaqItemsChange = (items: FAQItem[]) => {
    const oldItems = faqItems;
    const newItems = items;

    // Find added items (items with new IDs or temp IDs like timestamps)
    const added = newItems.filter(
      (newItem) => !oldItems.find((old) => old.id === newItem.id),
    );

    // Find removed items
    const removed = oldItems.filter(
      (oldItem) => !newItems.find((newItem) => newItem.id === oldItem.id),
    );

    // Find edited items (same ID but different content)
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
        pageId: page.id,
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

  const pageAvatarUrl = `https://graph.facebook.com/${page.id}/picture?type=large`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={pageAvatarUrl} alt={page.name} />
            <AvatarFallback>{page.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="mb-1">{page.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('facebook.pageSettings.addedAgo', {
                time: formatDistanceToNow(new Date(page.createdAt), { locale }),
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
          idPrefix={`${page.id}-`}
        />

        <SpamDetectionSection
          enabled={spamDetectionEnabled}
          onEnabledChange={handleSpamDetectionEnabledChange}
          action={spamAction}
          onActionChange={handleSpamActionChange}
          idPrefix={`${page.id}-`}
        />

        <IntelligentFAQSection
          enabled={intelligentFAQEnabled}
          onEnabledChange={handleIntelligentFAQEnabledChange}
          faqItems={faqItems}
          onFaqItemsChange={handleFaqItemsChange}
          idPrefix={`${page.id}-`}
        />
      </CardContent>
    </Card>
  );
}

export default FacebookPage;
