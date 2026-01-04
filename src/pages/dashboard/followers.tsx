import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { DashboardLayout } from '~/components/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { Filter } from 'lucide-react';

const FollowersPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [followerNameFilter, setFollowerNameFilter] = useState('');
  const [followerNameInput, setFollowerNameInput] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();

  const { data: pages } = trpc.auth.getPages.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const { data, isLoading: followersLoading } = trpc.auth.getFollowers.useQuery(
    {
      pageId: pageFilter === 'all' ? undefined : pageFilter,
      followerName: followerNameFilter || undefined,
      page: currentPage,
      limit: 20,
    },
    {
      enabled: !!session?.user,
    },
  );

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (followerNameInput !== followerNameFilter) {
        setFollowerNameFilter(followerNameInput);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [followerNameInput, followerNameFilter]);

  const handleClearFilters = () => {
    setPageFilter('all');
    setFollowerNameInput('');
    setFollowerNameFilter('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('followers.title')}>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  const followers = data?.followers || [];
  const pagination = data?.pagination;
  const followersCount = !followersLoading
    ? pagination?.total ?? followers.length
    : undefined;
  const headerTitle =
    followersCount !== undefined
      ? `${t('followers.title')} (${followersCount})`
      : t('followers.title');

  return (
    <DashboardLayout
      pageTitle={headerTitle}
      headerRight={
        <Button variant="outline" onClick={() => setIsFiltersOpen(true)}>
          <Filter className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('followers.filters.filter')}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Followers Table */}
        {followersLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('followers.list.noFollowers')}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('followers.table.follower')}</TableHead>
                    <TableHead>{t('followers.table.page')}</TableHead>
                    <TableHead>{t('followers.table.comments')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followers.map((follower, index) => (
                    <TableRow
                      key={`${follower.fromId}-${follower.pageId}-${index}`}
                    >
                      <TableCell className="font-medium">
                        {follower.fromName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{follower.pageName}</span>
                          {follower.provider === 'INSTAGRAM' && (
                            <span className="text-xs text-muted-foreground">
                              (Instagram)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            follower.suspectComments > 0
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }
                        >
                          {t('followers.table.suspectComments', {
                            suspect: follower.suspectComments,
                            total: follower.totalComments,
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('followers.pagination.showing', {
                    from: (pagination.page - 1) * pagination.limit + 1,
                    to: Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    ),
                    total: pagination.total,
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {t('followers.pagination.previous')}
                  </Button>
                  <div className="flex items-center px-3 text-sm">
                    {t('followers.pagination.page', {
                      current: pagination.page,
                      total: pagination.totalPages,
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    {t('followers.pagination.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('followers.filters.title')}</SheetTitle>
            <SheetDescription>
              {t('followers.filters.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('followers.filters.page')}
              </label>
              <Select
                value={pageFilter}
                onValueChange={(value) => {
                  setPageFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('followers.filters.allPages')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('followers.filters.allPages')}
                  </SelectItem>
                  {pages?.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('followers.filters.follower')}
              </label>
              <Input
                placeholder={t('followers.filters.followerPlaceholder')}
                value={followerNameInput}
                onChange={(e) => setFollowerNameInput(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                {t('followers.filters.clear')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default FollowersPage;
