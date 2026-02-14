import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import SEO from '~/components/SEO';
import type { NextPageWithLayout } from './_app';

type LegalSection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

const CgvPage: NextPageWithLayout = () => {
  const { t, i18n } = useTranslation();
  const updatedAt = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'long',
  }).format(new Date());
  const sections = t('cgv.sections', { returnObjects: true }) as LegalSection[];

  return (
    <>
      <SEO
        title={t('legalDocuments.sales.metaTitle', 'Conditions Générales de Vente')}
        description={t('legalDocuments.sales.metaDescription', 'Découvrez les conditions générales de vente de Moderateur Bedones, incluant les tarifs, les conditions de paiement et les modalités d\'abonnement.')}
      />
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <main className="container mx-auto px-4 pb-12 max-w-4xl relative z-10">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
                {t('legalDocuments.sales.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('legalArticle.updatedLabel')} {updatedAt}
              </p>
            </header>

            <div className="text-gray-700 leading-relaxed">
              <p className="mb-8">{t('cgv.intro')}</p>
              {sections.map((section) => (
                <section key={section.title} className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.title}-paragraph-${index}`}
                      className="mb-4 last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.items && section.items.length > 0 && (
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                      {section.items.map((item, index) => (
                        <li key={`${section.title}-item-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default CgvPage;
