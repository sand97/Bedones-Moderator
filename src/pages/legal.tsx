import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { LegalCards } from '~/components/legal/LegalCards';
import SEO from '~/components/SEO';
import type { NextPageWithLayout } from './_app';

const LegalPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('legalPage.metaTitle', 'Mentions Légales')}
        description={t('legalPage.metaDescription', 'Consultez les mentions légales, la politique de confidentialité et les conditions d\'utilisation de Moderateur Bedones.')}
      />
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <main className="container mx-auto px-4 pb-12 max-w-5xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-light text-black mb-3">
              {t('legalPage.title')}
            </h1>
            <p className="text-gray-500">{t('legalPage.subtitle')}</p>
          </div>

          <LegalCards />
        </main>
      </div>
      <Footer />
    </>
  );
};

export default LegalPage;
