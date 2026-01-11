import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '~/components/DashboardLayout';
import { UpgradeCard } from '~/components/UpgradeCard';
import { trpc } from '~/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  TrendingUp,
  Zap,
  MessageSquare,
  HelpCircle,
  Facebook,
  Instagram,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '~/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';

export default function UsagesPage() {
  const { t } = useTranslation();

  // Fetch usage summary
  const { data: summary, isLoading: isLoadingSummary } = trpc.usage.getSummary.useQuery();

  // Fetch current subscription to check if user is on free plan
  const { data: currentData } = trpc.subscription.getCurrent.useQuery();

  // Fetch usage history (30 days)
  const { data: history = [], isLoading: isLoadingHistory } = trpc.usage.getHistory.useQuery({
    days: 30,
  });

  // Fetch platform breakdown
  const { data: platformData } = trpc.usage.getByPlatform.useQuery();

  // Fetch current period usage
  const { data: currentPeriod } = trpc.usage.getCurrentPeriod.useQuery();

  // Fetch top pages
  const { data: topPages = [] } = trpc.usage.getTopPages.useQuery({
    limit: 5,
  });

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <DashboardLayout pageTitle={t('usage.title')}>
      <div className="space-y-6">
        {/* Upgrade Card for Free Plan Users */}
        {currentData?.subscription?.tier === 'FREE' && <UpgradeCard />}

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('usage.totalCredits')}
              </CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(summary?.creditsInfo.moderationCredits || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('usage.moderationCredits')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('usage.faqCredits')}
              </CardTitle>
              <HelpCircle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(summary?.creditsInfo.faqCredits || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('usage.faqCredits')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('usage.totalAnalyzed')}
              </CardTitle>
              <MessageSquare className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(summary?.usageStats.totalCommentsAnalyzed || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('usage.last30Days')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Period Usage */}
        {currentPeriod && currentPeriod.monthlyLimit > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                {t('usage.currentPeriod')}
              </CardTitle>
              <CardDescription>{t('usage.currentPeriodDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {t('usage.usage')}: {currentPeriod.currentMonthUsage.toLocaleString()} / {currentPeriod.monthlyLimit.toLocaleString()}
                  </span>
                  <span className={`text-sm font-bold ${getUsageColor(currentPeriod.usagePercentage)}`}>
                    {currentPeriod.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={currentPeriod.usagePercentage} className="h-2" />
              </div>

              {currentPeriod.usagePercentage >= 80 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-100">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{t('usage.nearLimit')}</p>
                    <p className="text-xs mt-1">
                      {t('usage.nearLimitDescription', { remaining: currentPeriod.remaining })}
                    </p>
                  </div>
                </div>
              )}

              {currentPeriod.usageResetDate && (
                <p className="text-sm text-muted-foreground">
                  {t('usage.resetsOn')} {new Date(currentPeriod.usageResetDate).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pages">{t('usage.byPage')}</TabsTrigger>
            <TabsTrigger value="platform">{t('usage.byPlatform')}</TabsTrigger>
            <TabsTrigger value="history">{t('usage.history')}</TabsTrigger>
          </TabsList>

          {/* By Page */}
          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('usage.topPages')}</CardTitle>
                <CardDescription>{t('usage.topPagesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : topPages.length > 0 ? (
                  <div className="space-y-4">
                    {topPages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarImage src={page.profilePictureUrl || undefined} />
                            <AvatarFallback>
                              {page.provider === 'FACEBOOK' ? <Facebook className="size-5" /> : <Instagram className="size-5" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{page.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {page.postsCount} {t('usage.posts')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{page.totalUsage.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {page.moderationUsage} {t('usage.mod')} + {page.faqUsage} {t('usage.faq')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {t('usage.noData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Platform */}
          <TabsContent value="platform" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('usage.platformBreakdown')}</CardTitle>
                <CardDescription>{t('usage.platformBreakdownDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {platformData && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Facebook className="size-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="font-medium">Facebook</p>
                          <p className="text-sm text-muted-foreground">
                            {platformData.total > 0
                              ? ((platformData.facebook / platformData.total) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{platformData.facebook.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t('usage.comments')}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900">
                          <Instagram className="size-6 text-pink-600 dark:text-pink-300" />
                        </div>
                        <div>
                          <p className="font-medium">Instagram</p>
                          <p className="text-sm text-muted-foreground">
                            {platformData.total > 0
                              ? ((platformData.instagram / platformData.total) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{platformData.instagram.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t('usage.comments')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('usage.usageHistory')}</CardTitle>
                <CardDescription>{t('usage.usageHistoryDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <Skeleton className="h-64 w-full" />
                ) : history.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('usage.date')}</TableHead>
                        <TableHead className="text-right">{t('usage.comments')}</TableHead>
                        <TableHead className="text-right">{t('usage.facebook')}</TableHead>
                        <TableHead className="text-right">{t('usage.instagram')}</TableHead>
                        <TableHead className="text-right">{t('usage.cost')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((day) => (
                        <TableRow key={day.id}>
                          <TableCell className="font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">{day.commentsAnalyzed}</TableCell>
                          <TableCell className="text-right">{day.facebookComments}</TableCell>
                          <TableCell className="text-right">{day.instagramComments}</TableCell>
                          <TableCell className="text-right">${day.estimatedCost.toFixed(4)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {t('usage.noHistoryData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
