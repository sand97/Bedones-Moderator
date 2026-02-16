import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import SEO from '~/components/SEO';
import JsonLd from '~/components/JsonLd';
import type { NextPageWithLayout } from './_app';
import {
  Shield,
  Zap,
  MessageSquare,
  Brain,
  BarChart3,
  Globe2,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const FeaturesPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      titleKey: 'features.spamDetection.title',
      titleFallback: 'Détection de Spam Intelligente',
      descKey: 'features.spamDetection.description',
      descFallback: 'Notre IA analyse chaque commentaire pour détecter automatiquement le spam, les liens suspects, et le contenu promotionnel non sollicité. Réduisez jusqu\'à 95% du spam sur vos publications.',
      highlights: [
        'Détection en temps réel',
        'Apprentissage automatique',
        'Taux de précision > 98%',
        'Action automatique (masquer/supprimer)'
      ]
    },
    {
      icon: MessageSquare,
      titleKey: 'features.unwantedComments.title',
      titleFallback: 'Filtrage des Commentaires Indésirables',
      descKey: 'features.unwantedComments.description',
      descFallback: 'Bloquez automatiquement les commentaires contenant un langage inapproprié, des insultes ou du contenu offensant. Protégez votre communauté et votre image de marque.',
      highlights: [
        'Détection de langage offensant',
        'Règles personnalisables',
        'Support multilingue (FR/EN)',
        'Modération préventive'
      ]
    },
    {
      icon: Brain,
      titleKey: 'features.intelligentFaq.title',
      titleFallback: 'FAQ Intelligente Automatique',
      descKey: 'features.intelligentFaq.description',
      descFallback: 'Configurez des questions-réponses et laissez l\'IA répondre automatiquement aux questions fréquentes de votre audience. Gagnez des heures chaque semaine.',
      highlights: [
        'Réponses automatiques personnalisées',
        'Compréhension contextuelle',
        'Base de connaissances évolutive',
        'Réduction du temps de réponse'
      ]
    },
    {
      icon: Zap,
      titleKey: 'features.realTime.title',
      titleFallback: 'Modération en Temps Réel',
      descKey: 'features.realTime.description',
      descFallback: 'Surveillez et modérez vos commentaires dès leur publication. Chaque nouveau commentaire est analysé instantanément pour une protection maximale.',
      highlights: [
        'Analyse instantanée',
        'Notifications en temps réel',
        'Action immédiate',
        'Webhooks Facebook/Instagram'
      ]
    },
    {
      icon: Globe2,
      titleKey: 'features.multiPlatform.title',
      titleFallback: 'Support Multi-Plateformes',
      descKey: 'features.multiPlatform.description',
      descFallback: 'Gérez vos commentaires Facebook ET Instagram depuis une seule interface. Connectez plusieurs pages et comptes pour une gestion centralisée.',
      highlights: [
        'Facebook Pages',
        'Comptes Instagram Business',
        'Multi-comptes',
        'Interface unifiée'
      ]
    },
    {
      icon: BarChart3,
      titleKey: 'features.analytics.title',
      titleFallback: 'Statistiques Détaillées',
      descKey: 'features.analytics.description',
      descFallback: 'Suivez l\'activité de modération avec des statistiques complètes. Visualisez les tendances, les types de spam détectés et l\'engagement de votre communauté.',
      highlights: [
        'Tableau de bord analytique',
        'Rapports de modération',
        'Historique complet',
        'Export de données'
      ]
    },
    {
      icon: Clock,
      titleKey: 'features.timeSaving.title',
      titleFallback: 'Gain de Temps Considérable',
      descKey: 'features.timeSaving.description',
      descFallback: 'Automatisez jusqu\'à 90% de votre modération. Concentrez-vous sur votre contenu pendant que Moderateur Bedones protège votre communauté.',
      highlights: [
        'Automatisation complète',
        'Réduction de 80% du temps de modération',
        'Priorité aux vrais messages',
        'Plus de temps pour créer'
      ]
    },
    {
      icon: Users,
      titleKey: 'features.community.title',
      titleFallback: 'Protection de la Communauté',
      descKey: 'features.community.description',
      descFallback: 'Créez un environnement sain et sécurisé pour vos followers. Une communauté bien modérée est une communauté engagée et fidèle.',
      highlights: [
        'Environnement positif',
        'Engagement accru',
        'Confiance renforcée',
        'Croissance organique'
      ]
    }
  ];

  return (
    <>
      <SEO
        title={t('features.metaTitle', 'Fonctionnalités - Modération IA pour Facebook & Instagram')}
        description={t('features.metaDescription', 'Découvrez toutes les fonctionnalités de Moderateur Bedones: détection de spam par IA, filtrage intelligent, FAQ automatique, modération en temps réel et bien plus.')}
      />
      <JsonLd type="organization" />

      <div className="flex min-h-screen flex-col">
        <div className="app-grid-bg relative overflow-hidden flex-1 flex flex-col">
          <Header className="pt-4 pb-8" />

          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative py-16 px-6">
              <div className="mx-auto max-w-6xl text-center">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                  {t('features.hero.title', 'Fonctionnalités Puissantes pour une Modération Efficace')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('features.hero.subtitle', 'Moderateur Bedones combine intelligence artificielle et automatisation pour vous offrir la meilleure solution de modération pour Facebook et Instagram.')}
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-12 px-6">
              <div className="mx-auto max-w-6xl">
                <div className="grid md:grid-cols-2 gap-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-4 rounded-lg border border-border p-8 transition-colors hover:bg-secondary"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
                          <Icon className="h-5 w-5" />
                        </div>

                        <h2 className="text-lg font-semibold text-foreground">
                          {t(feature.titleKey, feature.titleFallback)}
                        </h2>

                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t(feature.descKey, feature.descFallback)}
                        </p>

                        <ul className="space-y-2 mt-2">
                          {feature.highlights.map((highlight, hIndex) => (
                            <li key={hIndex} className="flex items-start gap-3">
                              <CheckCircle2 className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" strokeWidth={2} />
                              <span className="text-sm text-muted-foreground">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 app-grid-bg border-t border-border">
              <div className="mx-auto max-w-6xl flex flex-col items-center text-center">
                <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground">
                  {t('features.cta.title', 'Prêt à automatiser votre modération ?')}
                </h2>
                <p className="mb-8 max-w-xl text-base text-muted-foreground">
                  {t('features.cta.description', 'Rejoignez des centaines de créateurs et entreprises qui font confiance à Moderateur Bedones pour protéger leur communauté.')}
                </p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  {t('features.cta.button', 'Commencer Gratuitement')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </section>
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default FeaturesPage;
