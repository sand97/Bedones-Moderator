import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { DashboardLayout } from '~/components/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
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

const FollowersPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageFilter, setPageFilter] = useState<string>('');
  const [followerNameFilter, setFollowerNameFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();

  const { data: pages } = trpc.auth.getPages.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const { data, isLoading: followersLoading } = trpc.auth.getFollowers.useQuery(
    {
      pageId: pageFilter || undefined,
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

  const handleSearch = () => {
    setFollowerNameFilter(searchInput);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setPageFilter('');
    setSearchInput('');
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
          <Skeleton className="h-32 w-full" />
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

  return (
    <DashboardLayout pageTitle={t('followers.title')}>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('followers.filters.title')}</CardTitle>
            <CardDescription>
              {t('followers.filters.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Page Filter */}
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
                    <SelectValue
                      placeholder={t('followers.filters.allPages')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
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

              {/* Follower Name Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('followers.filters.follower')}
                </label>
                <Input
                  placeholder={t('followers.filters.followerPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Actions</label>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    {t('followers.filters.filter')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    {t('followers.filters.clear')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Followers Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('followers.list.title')}</CardTitle>
            <CardDescription>
              {pagination && `${pagination.total} ${t('followers.list.total')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FollowersPage;
