import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { HelpCards } from '~/components/help/HelpCards';
import type { NextPageWithLayout } from './_app';

const HelpPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

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

          <HelpCards />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HelpPage;
