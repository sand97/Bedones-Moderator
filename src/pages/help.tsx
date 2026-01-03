import Head from 'next/head';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/nextjs';
import { ChevronDown } from 'lucide-react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
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
import { useToast } from '~/hooks/use-toast';
import { useSession } from '~/lib/auth-client';
import type { NextPageWithLayout } from './_app';

type HelpFormState = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

const HelpPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [formState, setFormState] = useState<HelpFormState>({
    name: '',
    email: '',
    topic: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    setFormState((prev) => ({
      ...prev,
      name: prev.name || session.user.name || '',
      email: prev.email || session.user.email || '',
    }));
  }, [session?.user?.name, session?.user?.email, session?.user]);

  const faqItems = [
    {
      question: t('helpPage.faq.items.connect.question'),
      answer: t('helpPage.faq.items.connect.answer'),
    },
    {
      question: t('helpPage.faq.items.missingPages.question'),
      answer: t('helpPage.faq.items.missingPages.answer'),
    },
    {
      question: t('helpPage.faq.items.moderation.question'),
      answer: t('helpPage.faq.items.moderation.answer'),
    },
    {
      question: t('helpPage.faq.items.faqRules.question'),
      answer: t('helpPage.faq.items.faqRules.answer'),
    },
    {
      question: t('helpPage.faq.items.history.question'),
      answer: t('helpPage.faq.items.history.answer'),
    },
  ];

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

      toast({
        title: t('helpPage.form.successTitle'),
        description: t('helpPage.form.successDescription'),
      });

      setFormState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        topic: 'general',
        message: '',
      });
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
    <>
      <Head>
        <title>{t('helpPage.title')} - Bedones Moderator</title>
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 pb-12 max-w-5xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light text-black mb-3">
              {t('helpPage.title')}
            </h1>
            <p className="text-gray-500">{t('helpPage.subtitle')}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {t('helpPage.faq.title')}
                </CardTitle>
                <CardDescription>
                  {t('helpPage.faq.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqItems.map((item) => (
                  <details
                    key={item.question}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-900">
                      <span>{item.question}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </summary>
                    <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
                  </details>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {t('helpPage.contact.title')}
                </CardTitle>
                <CardDescription>
                  {t('helpPage.contact.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="help-name">
                        {t('helpPage.form.name')}
                      </Label>
                      <Input
                        id="help-name"
                        name="name"
                        autoComplete="name"
                        value={formState.name}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="help-email">
                        {t('helpPage.form.email')}
                      </Label>
                      <Input
                        id="help-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formState.email}
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
                    <Label htmlFor="help-topic">
                      {t('helpPage.form.topic')}
                    </Label>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HelpPage;
