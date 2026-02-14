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
  CheckCircle2
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
            <section className="relative py-16 px-4">
              <div className="container mx-auto max-w-6xl text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  {t('features.hero.title', 'Fonctionnalités Puissantes pour une Modération Efficace')}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  {t('features.hero.subtitle', 'Moderateur Bedones combine intelligence artificielle et automatisation pour vous offrir la meilleure solution de modération pour Facebook et Instagram.')}
                </p>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-12 px-4">
              <div className="container mx-auto max-w-7xl">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className="group p-8 rounded-3xl border border-border/70 bg-card hover:border-black transition-all duration-300"
                      >
                        {/* Icon */}
                        <div className="mb-6 w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:scale-110 transition-all duration-300">
                          <Icon className="h-7 w-7 text-black group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold mb-4 text-foreground">
                          {t(feature.titleKey, feature.titleFallback)}
                        </h2>

                        {/* Description */}
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {t(feature.descKey, feature.descFallback)}
                        </p>

                        {/* Highlights */}
                        <ul className="space-y-2">
                          {feature.highlights.map((highlight, hIndex) => (
                            <li key={hIndex} className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                              <span className="text-sm text-foreground/80">{highlight}</span>
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
            <section className="py-16 px-4">
              <div className="container mx-auto max-w-4xl">
                <div className="bg-black text-white rounded-3xl p-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {t('features.cta.title', 'Prêt à automatiser votre modération ?')}
                  </h2>
                  <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                    {t('features.cta.description', 'Rejoignez des centaines de créateurs et entreprises qui font confiance à Moderateur Bedones pour protéger leur communauté.')}
                  </p>
                  <a
                    href="/"
                    className="inline-block bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {t('features.cta.button', 'Commencer Gratuitement')}
                  </a>
                </div>
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
