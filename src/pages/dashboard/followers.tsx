import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { DashboardLayout } from '~/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Filter } from 'lucide-react';

const FollowersPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: pages } = trpc.auth.getPages.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Filter states
  const [pageId, setPageId] = useState<string>('');
  const [followerName, setFollowerName] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [session, sessionLoading, router]);

  const handleClearFilters = () => {
    setPageId('');
    setFollowerName('');
  };

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('followers.title')}>
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
    <DashboardLayout pageTitle={t('followers.title')}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('followers.list.title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('followers.description')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('followers.filters.filter')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('followers.list.noFollowers')}</p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('followers.filters.title')}</SheetTitle>
            <SheetDescription>
              {t('followers.filters.description')}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Page Filter */}
            <div className="space-y-2">
              <Label htmlFor="page-filter">{t('followers.filters.page')}</Label>
              <Select
                value={pageId || 'all'}
                onValueChange={(value) => {
                  setPageId(value === 'all' ? '' : value);
                }}
              >
                <SelectTrigger id="page-filter">
                  <SelectValue
                    placeholder={t('followers.filters.allPages')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('followers.filters.allPages')}
                  </SelectItem>
                  {pages?.map((page) => (
                    <SelectItem key={page.id} value={page.id || 'unknown'}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Follower Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="follower-filter">
                {t('followers.filters.follower')}
              </Label>
              <Input
                id="follower-filter"
                placeholder={t('followers.filters.followerPlaceholder')}
                value={followerName}
                onChange={(e) => setFollowerName(e.target.value)}
              />
            </div>

            {/* Clear Filters */}
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
