import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/nextjs';
import { useToast } from '~/hooks/use-toast';
import { useSession } from '~/lib/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

type HelpFormState = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export function ContactSupportCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: sessionData } = useSession();
  const [formState, setFormState] = useState<HelpFormState>({
    name: '',
    email: '',
    topic: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const user = sessionData?.user;
  const isUserPrefilled = Boolean(user);

  useEffect(() => {
    if (!user) return;

    setFormState((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
    }));
  }, [user?.name, user?.email, user]);

  const topics = [
    { value: 'general', label: t('helpPage.topics.general') },
    { value: 'account', label: t('helpPage.topics.account') },
    { value: 'moderation', label: t('helpPage.topics.moderation') },
    { value: 'billing', label: t('helpPage.topics.billing') },
    { value: 'bug', label: t('helpPage.topics.bug') },
  ];

  const canSubmit =
    !isSubmitting &&
    formState.message.trim().length > 0 &&
    formState.email.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (typeof Sentry.sendFeedback !== 'function') {
        throw new Error('Sentry feedback is unavailable');
      }

      await Sentry.sendFeedback({
        message: formState.message.trim(),
        name: formState.name.trim() || undefined,
        email: formState.email.trim() || undefined,
        tags: {
          topic: formState.topic,
          source: 'help-page',
        },
      });

      setFormState({
        name: user?.name || '',
        email: user?.email || '',
        topic: 'general',
        message: '',
      });
      setIsDialogOpen(false);
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error('Failed to send feedback', error);
      toast({
        variant: 'destructive',
        title: t('helpPage.form.errorTitle'),
        description: t('helpPage.form.errorDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl">
          {t('helpPage.contact.title')}
        </CardTitle>
        <CardDescription>{t('helpPage.contact.description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">{t('helpPage.contact.title')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('helpPage.contact.title')}</DialogTitle>
              <DialogDescription>
                {t('helpPage.contact.description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="help-name">{t('helpPage.form.name')}</Label>
                  <Input
                    id="help-name"
                    name="name"
                    autoComplete="name"
                    value={formState.name}
                    disabled={isUserPrefilled}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="help-email">{t('helpPage.form.email')}</Label>
                  <Input
                    id="help-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formState.email}
                    disabled={isUserPrefilled}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="help-topic">{t('helpPage.form.topic')}</Label>
                <Select
                  value={formState.topic}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      topic: value,
                    }))
                  }
                >
                  <SelectTrigger id="help-topic">
                    <SelectValue
                      placeholder={t('helpPage.form.topicPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.value} value={topic.value}>
                        {topic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="help-message">
                  {t('helpPage.form.message')}
                </Label>
                <Textarea
                  id="help-message"
                  name="message"
                  rows={5}
                  required
                  value={formState.message}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {isSubmitting
                    ? t('helpPage.form.sending')
                    : t('helpPage.form.submit')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('helpPage.form.supportHours')}
                </p>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isConfirmationOpen}
          onOpenChange={setIsConfirmationOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('helpPage.form.successTitle')}</DialogTitle>
              <DialogDescription>
                {t('helpPage.form.successDescription')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setIsConfirmationOpen(false)}>
                {t('helpPage.form.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
