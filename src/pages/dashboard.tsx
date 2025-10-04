import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { trpc } from '~/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { DashboardLayout } from '~/components/DashboardLayout';
import { Facebook, MessageSquare } from 'lucide-react';

const DashboardPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: stats, isLoading: statsLoading } =
    trpc.auth.getDashboardStats.useQuery(undefined, {
      enabled: !!session?.user,
    });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  if (sessionLoading || statsLoading) {
    return (
      <DashboardLayout pageTitle={t('sidebar.dashboard')}>
        <p>Loading...</p>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle={t('sidebar.dashboard')}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('dashboard.overview')}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Connected Pages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.connectedPages')}
            </CardTitle>
            <Facebook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.connectedPagesCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.pagesDescription')}
            </p>
          </CardContent>
        </Card>

        {/* Moderated Comments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.moderatedComments')}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.moderatedCommentsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.commentsDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
