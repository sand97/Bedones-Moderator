import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FacebookConnectButton } from '~/components/FacebookConnectButton';
import { InstagramConnectButton } from '~/components/InstagramConnectButton';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import {
  IntelligentFAQSection,
  type FAQItem,
} from '~/components/IntelligentFAQSection';
import { SpamDetectionSection } from '~/components/SpamDetectionSection';
import { Card, CardContent } from '~/components/ui/card';
import { UndesiredCommentsSection } from '~/components/UndesiredCommentsSection';
import { useSession } from '~/lib/auth-client';
import type { NextPageWithLayout } from './_app';
import Link from 'next/link';
import SEO from '~/components/SEO';
import JsonLd from '~/components/JsonLd';
import { Shield, Zap, Brain, BarChart3 } from 'lucide-react';

const IndexPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [undesiredCommentsEnabled, setUndesiredCommentsEnabled] =
    useState(true);
  const [undesiredCommentsAction, setUndesiredCommentsAction] = useState<
    'delete' | 'hide'
  >('hide');
  const [spamDetectionEnabled, setSpamDetectionEnabled] = useState(true);
  const [spamAction, setSpamAction] = useState<'delete' | 'hide'>('delete');
  const [intelligentFAQEnabled, setIntelligentFAQEnabled] = useState(false);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (!isPending && session?.user) {
      router.push('/dashboard');
    }
  }, [session, isPending, router]);

  // Show nothing while checking session or redirecting
  if (isPending || session?.user) {
    return (
      <>
        <SEO
          title={t('page.metaTitle')}
          description={t('page.metaDescription')}
        />
        <JsonLd type="product" />
      </>
    );
  }

  return (
    <>
      <SEO
        title={t('page.metaTitle')}
        description={t('page.metaDescription')}
      />
      <JsonLd type="product" />
      <div className="min-h-[90vh] app-grid-bg relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 pb-4 max-w-2xl relative z-10">
          <div className="text-center mb-6">
            <h1 className="lg:text-5xl text-3xl font-bold text-black mb-4">
              {t('page.title')}
            </h1>
            <p className="text-gray-600 font-normal text-lg max-w-xl mx-auto">{t('page.subtitle')}</p>
          </div>

          <div id="start-form" className="mb-8 space-y-2">
            <Card>
              <CardContent className="p-6">
                <UndesiredCommentsSection
                  enabled={undesiredCommentsEnabled}
                  onEnabledChange={setUndesiredCommentsEnabled}
                  action={undesiredCommentsAction}
                  onActionChange={setUndesiredCommentsAction}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <SpamDetectionSection
                  enabled={spamDetectionEnabled}
                  onEnabledChange={setSpamDetectionEnabled}
                  action={spamAction}
                  onActionChange={setSpamAction}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <IntelligentFAQSection
                  enabled={intelligentFAQEnabled}
                  onEnabledChange={setIntelligentFAQEnabled}
                  faqItems={faqItems}
                  onFaqItemsChange={setFaqItems}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <div className="max-w-full w-80 flex flex-col gap-2">
              <FacebookConnectButton
                undesiredCommentsEnabled={undesiredCommentsEnabled}
                undesiredCommentsAction={undesiredCommentsAction}
                spamDetectionEnabled={spamDetectionEnabled}
                spamAction={spamAction}
                intelligentFAQEnabled={intelligentFAQEnabled}
                faqItems={faqItems}
              />
              <InstagramConnectButton
                undesiredCommentsEnabled={undesiredCommentsEnabled}
                undesiredCommentsAction={undesiredCommentsAction}
                spamDetectionEnabled={spamDetectionEnabled}
                spamAction={spamAction}
                intelligentFAQEnabled={intelligentFAQEnabled}
                faqItems={faqItems}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-3">
              <Trans
                i18nKey="instagram.disclaimer"
                components={{
                  terms: (
                    <Link
                      href="/terms"
                      className="underline hover:text-gray-700"
                    />
                  ),
                  privacy: (
                    <Link
                      href="/privacy"
                      className="underline hover:text-gray-700"
                    />
                  ),
                }}
              />
            </p>
          </div>
        </div>
        {/* Background Illustrations */}
        {/* <div className="flex flex-col lg:flex-row justify-around lg:items-end items-center gap-8 lg:pt-16 py-8 px-8 pointer-events-none z-0">
        <MessageIllustration
          message={t('illustration.case1.message')}
          action={t('illustration.case1.action')}
        />
        <MessageIllustration
          message={t('illustration.case2.message')}
          action={t('illustration.case2.action')}
        />
        <MessageIllustration
          message={t('illustration.case3.message')}
          action={t('illustration.case3.action')}
        />
      </div> */}
      </div>

      {/* Section: Comment ça marche */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {t('home.howItWorks.title', 'Comment ça marche ?')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('home.howItWorks.subtitle', 'Trois étapes simples pour automatiser la modération de vos commentaires')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('home.howItWorks.step1.title', 'Connectez vos comptes')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step1.description', 'Liez vos pages Facebook et comptes Instagram en quelques clics de manière sécurisée.')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('home.howItWorks.step2.title', 'Configurez vos règles')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step2.description', 'Personnalisez la détection de spam, les commentaires indésirables et vos FAQ automatiques.')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t('home.howItWorks.step3.title', 'Laissez l\'IA travailler')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step3.description', 'Notre IA modère vos commentaires 24/7 en temps réel. Vous gardez le contrôle total.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Pourquoi Moderateur Bedones */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {t('home.whyUs.title', 'Pourquoi choisir Moderateur Bedones ?')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <Shield className="h-10 w-10 text-black mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-lg mb-2">
                {t('home.whyUs.feature1.title', 'IA Précise à 98%')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('home.whyUs.feature1.description', 'Détection ultra-précise du spam et des commentaires inappropriés grâce à notre IA avancée.')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <Zap className="h-10 w-10 text-black mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-lg mb-2">
                {t('home.whyUs.feature2.title', 'Modération Instantanée')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('home.whyUs.feature2.description', 'Vos commentaires sont analysés et modérés en temps réel, 24h/24 et 7j/7.')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <Brain className="h-10 w-10 text-black mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-lg mb-2">
                {t('home.whyUs.feature3.title', 'Réponses Automatiques')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('home.whyUs.feature3.description', 'FAQ intelligente qui répond automatiquement aux questions récurrentes de votre communauté.')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <BarChart3 className="h-10 w-10 text-black mb-4" strokeWidth={1.5} />
              <h3 className="font-bold text-lg mb-2">
                {t('home.whyUs.feature4.title', 'Gain de Temps')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('home.whyUs.feature4.description', 'Économisez jusqu\'à 90% du temps passé à modérer manuellement vos commentaires.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Stats / Social Proof */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('home.stats.title', 'Ils nous font confiance')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500K+</div>
              <p className="text-white/70">
                {t('home.stats.comments', 'Commentaires modérés')}
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold mb-2">150+</div>
              <p className="text-white/70">
                {t('home.stats.users', 'Créateurs et entreprises')}
              </p>
            </div>

            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <p className="text-white/70">
                {t('home.stats.spam', 'De spam bloqué automatiquement')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.cta.title', 'Prêt à automatiser votre modération ?')}
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle', 'Rejoignez des centaines de créateurs qui économisent des heures chaque semaine.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#start-form"
              className="inline-block bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors"
            >
              {t('home.cta.primary', 'Commencer Gratuitement')}
            </a>
            <Link
              href="/features"
              className="inline-block bg-white text-black border-2 border-black px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('home.cta.secondary', 'Voir les fonctionnalités')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @see https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.post.all.fetch();
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
