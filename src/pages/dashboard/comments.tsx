import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { DashboardLayout } from '~/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { CommentsFilters } from '~/components/comments/CommentsFilters';
import { CommentsListCard } from '~/components/comments/CommentsListCard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

const CommentsPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: pages } = trpc.auth.getPages.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Filter states
  const [pageId, setPageId] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorNameInput, setAuthorNameInput] = useState<string>(''); // For typing
  const [action, setAction] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const pageSize = 20;

  // Debounce author name input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authorNameInput !== authorName) {
        setAuthorName(authorNameInput);
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [authorNameInput, authorName]);

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } =
    trpc.comments.getComments.useQuery(
      {
        pageId: pageId || undefined,
        authorName: authorName || undefined,
        action: (action || undefined) as any,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      },
      {
        enabled: !!session?.user,
        placeholderData: (previousData) => previousData,
      },
    );

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  const handleClearFilters = () => {
    setPageId('');
    setAuthorName('');
    setAuthorNameInput('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('comments.title')}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle={t('comments.title')}>
      <CommentsListCard
        comments={commentsData?.comments}
        pagination={commentsData?.pagination}
        isLoading={commentsLoading}
        onPageChange={setPage}
        onOpenFilters={() => setIsFiltersOpen(true)}
      />

      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('comments.filters.title')}</SheetTitle>
            <SheetDescription>
              {t('comments.filters.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <CommentsFilters
              pageId={pageId}
              setPageId={(value) => {
                setPageId(value);
                setPage(1); // Reset to page 1 when filter changes
              }}
              authorName={authorNameInput}
              setAuthorName={setAuthorNameInput}
              action={action}
              setAction={(value) => {
                setAction(value);
                setPage(1); // Reset to page 1 when filter changes
              }}
              dateFrom={dateFrom}
              setDateFrom={(value) => {
                setDateFrom(value);
                setPage(1); // Reset to page 1 when filter changes
              }}
              dateTo={dateTo}
              setDateTo={(value) => {
                setDateTo(value);
                setPage(1); // Reset to page 1 when filter changes
              }}
              pages={pages}
              onClearFilters={handleClearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default CommentsPage;
