import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export function HelpFaqCard() {
  const { t } = useTranslation();

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

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl">{t('helpPage.faq.title')}</CardTitle>
        <CardDescription>{t('helpPage.faq.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
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
  );
}
