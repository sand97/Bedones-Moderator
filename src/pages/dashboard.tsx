import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { trpc } from '~/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { DashboardLayout } from '~/components/DashboardLayout';
import { UpgradeCard } from '~/components/UpgradeCard';
import { Facebook, Instagram, ExternalLink, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Skeleton } from '~/components/ui/skeleton';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfDay,
  startOfMonth,
  format,
} from 'date-fns';

// Helper functions to get date ranges
const getToday = () => {
  return { start: startOfToday(), end: endOfToday() };
};

const getThisWeek = () => {
  return { start: startOfWeek(new Date()), end: endOfDay(new Date()) };
};

const getThisMonth = () => {
  return { start: startOfMonth(new Date()), end: endOfDay(new Date()) };
};

const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

interface Provider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const providers: Provider[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: () => {
      return <Facebook stroke="transparent" fill="white" />;
    },
    enabled: true,
  },
  { id: 'instagram', name: 'Instagram', icon: Instagram, enabled: true },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: ({ className }: { className?: string }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    enabled: false,
  },
];

const DashboardPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();

  // Get pages count by provider
  const { data: pagesCount } = trpc.auth.getPagesCountByProvider.useQuery(
    undefined,
    { enabled: !!session?.user },
  );

  // Fetch current subscription to check if user is on free plan
  const { data: currentData } = trpc.subscription.getCurrent.useQuery(
    undefined,
    { enabled: !!session?.user },
  );

  // Mutation to apply initial settings
  const applySettings = trpc.auth.applyInitialSettingsToPages.useMutation({
    onSuccess: (data) => {
      toast({
        title: t('dashboard.settingsApplied.success'),
        description: t('dashboard.settingsApplied.successDescription', {
          count: data.pagesUpdated,
        }),
      });
      localStorage.removeItem('moderationSettings');
      setSettingsApplied(true);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('dashboard.settingsApplied.error'),
        description: error.message,
      });
      localStorage.removeItem('moderationSettings');
    },
  });

  // Get date ranges
  const today = getToday();
  const thisWeek = getThisWeek();
  const thisMonth = getThisMonth();

  // Fetch stats for all periods in a single call
  const { data: stats } =
    trpc.auth.getUndesirableCommentsStatsMultiple.useQuery(
      {
        intervals: [
          { startDate: today.start, endDate: today.end },
          { startDate: thisWeek.start, endDate: thisWeek.end },
          { startDate: thisMonth.start, endDate: thisMonth.end },
        ],
      },
      { enabled: !!session?.user },
    );

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  // Handle payment success/cancel notifications
  useEffect(() => {
    // Wait for router to be ready before checking query params
    if (!router.isReady) return;

    const payment = router.query.payment as string;

    if (payment === 'success') {
      setPaymentStatus('success');
      // Remove the query parameter from URL
      router.replace('/dashboard', undefined, { shallow: true });
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      // Remove the query parameter from URL
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router.isReady, router.query.payment, router]);

  // Apply initial settings from localStorage after OAuth
  useEffect(() => {
    if (!session?.user || settingsApplied || !pagesCount) return;

    // Check if update is disabled via query parameter (for existing users)
    const updateDisabled = router.query.update === 'disabled';
    if (updateDisabled) {
      localStorage.removeItem('moderationSettings');
      return;
    }

    const storedSettings = localStorage.getItem('moderationSettings');
    if (!storedSettings) return;

    // Only apply if user has pages (Facebook OR Instagram)
    const totalPages = (pagesCount.facebook || 0) + (pagesCount.instagram || 0);
    if (totalPages === 0) {
      localStorage.removeItem('moderationSettings');
      return;
    }

    try {
      const settings = JSON.parse(storedSettings);
      applySettings.mutate(settings);
    } catch (error) {
      console.error('Failed to parse moderation settings:', error);
      localStorage.removeItem('moderationSettings');
    }
  }, [session?.user, pagesCount, settingsApplied, router.query.update, applySettings]);

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('sidebar.dashboard')}>
        {/* Connected Pages Section Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-7 w-48" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-12">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Undesirable Comments Section Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-7 w-56" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-2">
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="mb-8">
                  <Skeleton className="h-9 w-12" />
                </div>
                <div className="absolute bottom-4 right-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
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

  const handleSettingsClick = (providerId: string) => {
    router.push(`/dashboard/${providerId}`);
  };

  const handleViewComments = (startDate: Date, endDate: Date) => {
    const params = new URLSearchParams({
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    });
    router.push(`/comments?${params.toString()}`);
  };

  const statsData = [
    {
      label: t('dashboard.today'),
      count: stats?.[0]?.count ?? 0,
      startDate: today.start,
      endDate: today.end,
    },
    {
      label: t('dashboard.thisWeek'),
      count: stats?.[1]?.count ?? 0,
      startDate: thisWeek.start,
      endDate: thisWeek.end,
    },
    {
      label: t('dashboard.thisMonth'),
      count: stats?.[2]?.count ?? 0,
      startDate: thisMonth.start,
      endDate: thisMonth.end,
    },
  ];

  return (
    <DashboardLayout pageTitle={t('sidebar.dashboard')}>
      {/* Payment Status Card */}
      {paymentStatus && (
        <Card
          className={cn(
            'mb-6 border-2',
            paymentStatus === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {paymentStatus === 'success' ? (
                  <CheckCircle className="size-6 text-green-600" />
                ) : (
                  <XCircle className="size-6 text-red-600" />
                )}
                <div>
                  <CardTitle
                    className={
                      paymentStatus === 'success'
                        ? 'text-green-900'
                        : 'text-red-900'
                    }
                  >
                    {paymentStatus === 'success'
                      ? t('payment.successTitle')
                      : t('payment.cancelledTitle')}
                  </CardTitle>
                  <CardDescription
                    className={
                      paymentStatus === 'success'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }
                  >
                    {paymentStatus === 'success'
                      ? t('payment.successDescription')
                      : t('payment.cancelledDescription')}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setPaymentStatus(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Upgrade Card for Free Plan Users */}
      {currentData?.subscription?.tier === 'FREE' && (
        <div className="mb-6">
          <UpgradeCard />
        </div>
      )}

      {/* Connected Pages Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('dashboard.connectedPages')}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <Card
              key={provider.id}
              className={cn(
                'relative overflow-hidden',
                !provider.enabled && 'opacity-60',
              )}
            >
              <CardContent className="p-6">
                {/* Title on left, Icon on right */}
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-lg font-semibold">{provider.name}</h3>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Count/Status on left bottom, ExternalLink on right bottom */}
                <div className="flex items-center justify-between">
                  <div>
                    {provider.enabled ? (
                      <p className="text-sm text-muted-foreground">
                        {pagesCount?.[provider.id as keyof typeof pagesCount] ??
                          0}{' '}
                        {t('dashboard.pages')}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.unavailable')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!provider.enabled}
                    onClick={() => handleSettingsClick(provider.id)}
                    className="rounded-full"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Undesirable Comments Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('dashboard.undesirableComments')}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsData.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold">{stat.count}</h2>
              </div>

              {/* External link button at bottom */}
              <div className="absolute bottom-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleViewComments(stat.startDate, stat.endDate)
                  }
                  className="rounded-full"
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
