import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '~/components/DashboardLayout';
import { HelpCards } from '~/components/help/HelpCards';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/utils/trpc';

const DashboardHelpPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.push('/');
    }
  }, [isLoading, session?.user, router]);

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={t('helpPage.title')}>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle={t('helpPage.title')}>
      <HelpCards />
    </DashboardLayout>
  );
};

export default DashboardHelpPage;
