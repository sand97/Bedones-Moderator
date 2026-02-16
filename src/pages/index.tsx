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
import { Shield, Zap, BarChart3, Eye, Settings, Trash2, ArrowRight } from 'lucide-react';

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
        <div className="container mx-auto px-6 pb-8 max-w-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              {t('page.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">{t('page.subtitle')}</p>
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
      </div>

      {/* Section: Fonctionnalités */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 flex flex-col items-center text-center">
            <span className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t('home.features.label', 'Fonctionnalités')}
            </span>
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t('home.whyUs.title', 'Pourquoi choisir Moderateur Bedones ?')}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Shield className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature1.title',
                titleFallback: 'Modération IA',
                descKey: 'home.whyUs.feature1.description',
                descFallback: "L'IA détecte et classe automatiquement les commentaires négatifs, spam et contenus inappropriés.",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature2.title',
                titleFallback: 'Réponses automatiques',
                descKey: 'home.whyUs.feature2.description',
                descFallback: "Définissez une liste de questions-réponses fréquentes et laissez l'IA répondre à votre place.",
              },
              {
                icon: <Trash2 className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature3.title',
                titleFallback: 'Suppression & masquage',
                descKey: 'home.whyUs.feature3.description',
                descFallback: "Activez la suppression ou le masquage automatique des commentaires néfastes détectés par l'IA.",
              },
              {
                icon: <Eye className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature4.title',
                titleFallback: 'Monitoring en temps réel',
                descKey: 'home.whyUs.feature4.description',
                descFallback: 'Suivez en temps réel tous les commentaires sur vos publications Facebook et Instagram.',
              },
              {
                icon: <Settings className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature5.title',
                titleFallback: 'Configuration flexible',
                descKey: 'home.whyUs.feature5.description',
                descFallback: 'Personnalisez les règles de modération, les seuils de sensibilité et les actions automatiques.',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                titleKey: 'home.whyUs.feature6.title',
                titleFallback: 'Tableau de bord',
                descKey: 'home.whyUs.feature6.description',
                descFallback: 'Visualisez les statistiques de modération, les tendances et les performances de votre communauté.',
              },
            ].map((feature) => (
              <div
                key={feature.titleFallback}
                className="flex flex-col gap-4 rounded-lg border border-border p-6 transition-colors hover:bg-secondary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {t(feature.titleKey, feature.titleFallback)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(feature.descKey, feature.descFallback)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Comment ça marche */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 flex flex-col items-center text-center">
            <span className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t('home.howItWorks.label', 'Comment ça marche')}
            </span>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t('home.howItWorks.title', '3 étapes simples')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                titleKey: 'home.howItWorks.step1.title',
                titleFallback: 'Connectez vos comptes',
                descKey: 'home.howItWorks.step1.description',
                descFallback: 'Liez vos pages Facebook et comptes Instagram en quelques clics de manière sécurisée.',
              },
              {
                step: '02',
                titleKey: 'home.howItWorks.step2.title',
                titleFallback: 'Configurez vos règles',
                descKey: 'home.howItWorks.step2.description',
                descFallback: 'Définissez vos questions-réponses, mots-clés à surveiller et actions automatiques.',
              },
              {
                step: '03',
                titleKey: 'home.howItWorks.step3.title',
                titleFallback: "Laissez l'IA travailler",
                descKey: 'home.howItWorks.step3.description',
                descFallback: "L'IA modère automatiquement 24/7. Consultez le tableau de bord pour suivre les résultats.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col gap-4 rounded-lg border border-border bg-background p-8"
              >
                <span className="text-3xl font-bold text-foreground">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold text-foreground">
                  {t(item.titleKey, item.titleFallback)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(item.descKey, item.descFallback)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Stats / Social Proof */}
      <section className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground mb-1">500K+</div>
              <p className="text-xs text-muted-foreground">
                {t('home.stats.comments', 'Commentaires modérés')}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground mb-1">150+</div>
              <p className="text-xs text-muted-foreground">
                {t('home.stats.users', 'Créateurs et entreprises')}
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground mb-1">95%</div>
              <p className="text-xs text-muted-foreground">
                {t('home.stats.spam', 'De spam bloqué automatiquement')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: CTA */}
      <section className="relative overflow-hidden border-t border-border app-grid-bg">
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground">
            {t('home.cta.title', 'Prêt à automatiser votre modération ?')}
          </h2>
          <p className="mb-8 max-w-xl text-base text-muted-foreground">
            {t('home.cta.subtitle', 'Rejoignez des centaines de créateurs qui économisent des heures chaque semaine.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#start-form"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              {t('home.cta.primary', 'Commencer Gratuitement')}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
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
