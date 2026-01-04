import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export function LegalCards() {
  const { t } = useTranslation();

  const cards = [
    {
      id: 'terms',
      title: t('legalDocuments.terms.title'),
      description: t('legalPage.cards.terms.description'),
      href: '/terms',
    },
    {
      id: 'privacy',
      title: t('legalDocuments.privacy.title'),
      description: t('legalPage.cards.privacy.description'),
      href: '/privacy',
    },
    {
      id: 'sales',
      title: t('legalDocuments.sales.title'),
      description: t('legalPage.cards.sales.description'),
      href: '/cgv',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.id} className="flex h-full flex-col">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg">{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto p-4 pt-0 sm:p-6 sm:pt-0">
            <Button variant="outline" asChild>
              <Link href={card.href}>{t('legalPage.cards.cta')}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
