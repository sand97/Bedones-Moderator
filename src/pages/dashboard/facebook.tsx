import type { NextPage } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { useToast } from '~/hooks/use-toast';
import { DashboardLayout } from '~/components/DashboardLayout';

const FacebookPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isLoading: sessionLoading } =
    trpc.auth.getSession.useQuery();
  const { data: pages, isLoading: pagesLoading } = trpc.auth.getPages.useQuery(
    undefined,
    {
      enabled: !!session?.user,
    }
  );

  const utils = trpc.useUtils();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  if (sessionLoading || pagesLoading) {
    return (
      <DashboardLayout pageTitle="Facebook">
        <p>Loading...</p>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle="Facebook">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Facebook Pages</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Facebook pages and moderation settings
        </p>
      </div>

      {pages && pages.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              No Facebook pages found. Please make sure you've granted access
              to your pages.
            </p>
          </CardContent>
        </Card>
      )}

      {pages && pages.length > 0 && (
        <div className="space-y-6">
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
  const utils = trpc.useUtils();

  const updateSettings = trpc.auth.updatePageSettings.useMutation({
    onSuccess: () => {
      toast({
        title: 'Settings updated successfully',
      });
      utils.auth.getPages.invalidate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update settings',
        description: error.message,
      });
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    updateSettings.mutate({
      pageId: page.id,
      [field]: value,
    });
  };

  const handleActionChange = (field: string, value: string) => {
    updateSettings.mutate({
      pageId: page.id,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{page.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Undesired Comments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`undesired-${page.id}`}>
              Filter Undesired Comments
            </Label>
            <Switch
              id={`undesired-${page.id}`}
              checked={page.settings?.undesiredCommentsEnabled || false}
              onCheckedChange={(checked) =>
                handleToggle('undesiredCommentsEnabled', checked)
              }
            />
          </div>
          {page.settings?.undesiredCommentsEnabled && (
            <RadioGroup
              value={page.settings?.undesiredCommentsAction || 'hide'}
              onValueChange={(value) =>
                handleActionChange('undesiredCommentsAction', value)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hide" id={`hide-undesired-${page.id}`} className="accent-black" />
                <Label htmlFor={`hide-undesired-${page.id}`}>
                  Hide undesired comments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="delete"
                  id={`delete-undesired-${page.id}`}
                  className="accent-black"
                />
                <Label htmlFor={`delete-undesired-${page.id}`}>
                  Delete undesired comments
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {/* Spam Detection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`spam-${page.id}`}>Detect and Handle Spam</Label>
            <Switch
              id={`spam-${page.id}`}
              checked={page.settings?.spamDetectionEnabled || false}
              onCheckedChange={(checked) =>
                handleToggle('spamDetectionEnabled', checked)
              }
            />
          </div>
          {page.settings?.spamDetectionEnabled && (
            <RadioGroup
              value={page.settings?.spamAction || 'delete'}
              onValueChange={(value) => handleActionChange('spamAction', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hide" id={`hide-spam-${page.id}`} className="accent-black" />
                <Label htmlFor={`hide-spam-${page.id}`}>
                  Hide spam comments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id={`delete-spam-${page.id}`} className="accent-black" />
                <Label htmlFor={`delete-spam-${page.id}`}>
                  Delete spam comments
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {/* Intelligent FAQ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`faq-${page.id}`}>
              Intelligent Generated Replies
            </Label>
            <Switch
              id={`faq-${page.id}`}
              checked={page.settings?.intelligentFAQEnabled || false}
              onCheckedChange={(checked) =>
                handleToggle('intelligentFAQEnabled', checked)
              }
            />
          </div>
          {page.settings?.intelligentFAQEnabled && (
            <div className="space-y-2">
              {page.settings?.faqRules?.length > 0 ? (
                page.settings.faqRules.map((rule: any) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <p className="font-medium">{rule.assertion}</p>
                    <p className="text-gray-600">{rule.response}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No FAQ rules configured yet
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FacebookPage;
