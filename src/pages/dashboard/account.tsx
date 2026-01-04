import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '~/components/DashboardLayout';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { trpc } from '~/utils/trpc';
import { toast } from '~/hooks/use-toast';
import { Mail, Shield, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

const DashboardAccountPage: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = trpc.auth.getSession.useQuery();

  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [emailSubscribed, setEmailSubscribed] = useState(true);
  const [emailTransactional, setEmailTransactional] = useState(true);
  const [emailPrefLoading, setEmailPrefLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/');
    }
  }, [sessionLoading, session?.user, router]);

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || '');
      setEmailSubscribed(session.user.emailSubscribed ?? true);
      setEmailTransactional(session.user.emailTransactional ?? true);
    }
  }, [session?.user]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setEmailLoading(true);
    try {
      const response = await fetch('/api/user/add-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('accountPage.email.success'),
          description: t('accountPage.email.successDescription'),
        });
        await refetchSession();
      } else {
        toast({
          title: t('accountPage.email.error'),
          description: data.error || t('accountPage.email.errorDescription'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Email update error:', error);
      toast({
        title: t('accountPage.email.error'),
        description: t('accountPage.email.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!session?.user) return;

    setResendLoading(true);
    try {
      const response = await fetch('/api/user/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('accountPage.email.resendSuccess'),
          description: t('accountPage.email.resendSuccessDescription'),
        });
      } else {
        toast({
          title: t('accountPage.email.resendError'),
          description: data.error || t('accountPage.email.resendErrorDescription'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast({
        title: t('accountPage.email.resendError'),
        description: t('accountPage.email.resendErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleEmailPreferencesUpdate = async (type: 'marketing' | 'transactional', checked: boolean) => {
    if (!session?.user) return;

    setEmailPrefLoading(true);

    if (type === 'marketing') {
      setEmailSubscribed(checked);
    } else {
      setEmailTransactional(checked);
    }

    try {
      const response = await fetch('/api/user/update-email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(type === 'marketing' && { emailSubscribed: checked }),
          ...(type === 'transactional' && { emailTransactional: checked }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('accountPage.preferences.success'),
          description: type === 'marketing'
            ? (checked
                ? t('accountPage.preferences.subscribedDescription')
                : t('accountPage.preferences.unsubscribedDescription'))
            : (checked
                ? t('accountPage.preferences.transactionalEnabledDescription')
                : t('accountPage.preferences.transactionalDisabledDescription')),
        });
        await refetchSession();
      } else {
        // Revert on error
        if (type === 'marketing') {
          setEmailSubscribed(!checked);
        } else {
          setEmailTransactional(!checked);
        }
        toast({
          title: t('accountPage.preferences.error'),
          description: data.error || t('accountPage.preferences.errorDescription'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Email preferences error:', error);
      // Revert on error
      if (type === 'marketing') {
        setEmailSubscribed(!checked);
      } else {
        setEmailTransactional(!checked);
      }
      toast({
        title: t('accountPage.preferences.error'),
        description: t('accountPage.preferences.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setEmailPrefLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: t('accountPage.delete.confirmError'),
        description: t('accountPage.delete.confirmErrorDescription'),
        variant: 'destructive',
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: t('accountPage.delete.success'),
          description: t('accountPage.delete.successDescription'),
        });
        // Redirect to home after deletion
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast({
          title: t('accountPage.delete.error'),
          description: data.error || t('accountPage.delete.errorDescription'),
          variant: 'destructive',
        });
        setDeleteLoading(false);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: t('accountPage.delete.error'),
        description: t('accountPage.delete.errorDescription'),
        variant: 'destructive',
      });
      setDeleteLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <DashboardLayout pageTitle={t('accountPage.title')}>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout pageTitle={t('accountPage.title')}>
      <div className="space-y-6 max-w-4xl">
        {/* Email Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>{t('accountPage.email.title')}</CardTitle>
            </div>
            <CardDescription>{t('accountPage.email.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('accountPage.email.label')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('accountPage.email.placeholder')}
                  required
                />
                {session.user.email && !session.user.emailVerified && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t('accountPage.email.notVerified')}</span>
                  </div>
                )}
                {session.user.email && session.user.emailVerified && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('accountPage.email.verified')}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={emailLoading || !email} className="flex-1">
                  {emailLoading ? t('accountPage.email.updating') : t('accountPage.email.update')}
                </Button>
                {session.user.email && !session.user.emailVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="flex-1"
                  >
                    {resendLoading ? t('accountPage.email.resending') : t('accountPage.email.resend')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>{t('accountPage.preferences.title')}</CardTitle>
            </div>
            <CardDescription>{t('accountPage.preferences.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="font-medium">
                  {t('accountPage.preferences.marketingEmails')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountPage.preferences.marketingEmailsDescription')}
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={emailSubscribed}
                onCheckedChange={(checked) => handleEmailPreferencesUpdate('marketing', checked)}
                disabled={emailPrefLoading}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="transactional-emails" className="font-medium">
                  {t('accountPage.preferences.transactionalEmails')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountPage.preferences.transactionalEmailsDescription')}
                </p>
              </div>
              <Switch
                id="transactional-emails"
                checked={emailTransactional}
                onCheckedChange={(checked) => handleEmailPreferencesUpdate('transactional', checked)}
                disabled={emailPrefLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">{t('accountPage.delete.title')}</CardTitle>
            </div>
            <CardDescription>{t('accountPage.delete.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {t('accountPage.delete.button')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('accountPage.delete.dialogTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('accountPage.delete.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                {t('accountPage.delete.confirmLabel')}
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
              <p className="text-sm text-muted-foreground">
                {t('accountPage.delete.confirmHint')}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                {t('accountPage.delete.warningTitle')}
              </p>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                <li>{t('accountPage.delete.warningItem1')}</li>
                <li>{t('accountPage.delete.warningItem2')}</li>
                <li>{t('accountPage.delete.warningItem3')}</li>
                <li>{t('accountPage.delete.warningItem4')}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={deleteLoading}
            >
              {t('accountPage.delete.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
            >
              {deleteLoading ? t('accountPage.delete.deleting') : t('accountPage.delete.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DashboardAccountPage;
