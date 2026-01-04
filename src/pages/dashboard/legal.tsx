import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '~/components/DashboardLayout';
import { LegalCards } from '~/components/legal/LegalCards';

export default function DashboardLegalPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout pageTitle={t('legalPage.title')}>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t('legalPage.subtitle')}
        </p>
        <LegalCards />
      </div>
    </DashboardLayout>
  );
}
