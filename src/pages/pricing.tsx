import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import SEO from '~/components/SEO';
import JsonLd from '~/components/JsonLd';
import type { NextPageWithLayout } from './_app';
import { Check, Sparkles } from 'lucide-react';

const PricingPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const plans = [
    {
      name: 'Starter',
      price: '5 000',
      currency: 'XAF',
      period: '/mois',
      description: 'Parfait pour les créateurs de contenu et petites entreprises',
      features: [
        '1 Page Facebook OU 1 Compte Instagram',
        'Détection de spam par IA',
        'Filtrage commentaires indésirables',
        'FAQ intelligente (5 règles max)',
        'Modération en temps réel',
        'Statistiques de base',
        'Support par email'
      ],
      cta: 'Commencer',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '15 000',
      currency: 'XAF',
      period: '/mois',
      description: 'Pour les professionnels et entreprises en croissance',
      features: [
        'Jusqu\'à 5 Pages Facebook + Instagram',
        'Détection de spam avancée',
        'Filtrage commentaires indésirables',
        'FAQ intelligente (illimitée)',
        'Modération en temps réel',
        'Statistiques avancées',
        'Historique complet',
        'Export de données',
        'Support prioritaire',
        'Règles de modération personnalisées'
      ],
      cta: 'Démarrer l\'essai',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: '50 000',
      currency: 'XAF',
      period: '/mois',
      description: 'Solution sur mesure pour les grandes organisations',
      features: [
        'Pages et comptes illimités',
        'Détection IA personnalisée',
        'Filtrage multi-critères avancé',
        'FAQ intelligente illimitée',
        'Modération en temps réel',
        'Tableaux de bord personnalisés',
        'API access',
        'Webhooks personnalisés',
        'Support dédié 24/7',
        'Formation de l\'équipe',
        'SLA garanti',
        'Intégrations sur mesure'
      ],
      cta: 'Nous contacter',
      highlighted: false
    }
  ];

  return (
    <>
      <SEO
        title={t('pricing.metaTitle', 'Tarifs - Plans de Modération IA pour Facebook & Instagram')}
        description={t('pricing.metaDescription', 'Choisissez le plan Moderateur Bedones adapté à vos besoins. Plans à partir de 5 000 XAF/mois. Essai gratuit disponible.')}
      />
      <JsonLd type="product" />

      <div className="flex min-h-screen flex-col">
        <div className="app-grid-bg relative overflow-hidden flex-1 flex flex-col">
          <Header className="pt-4 pb-8" />

          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative py-16 px-4">
              <div className="container mx-auto max-w-6xl text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                  {t('pricing.hero.title', 'Des Tarifs Simples et Transparents')}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  {t('pricing.hero.subtitle', 'Choisissez le plan qui correspond à vos besoins. Tous les plans incluent notre technologie IA de pointe.')}
                </p>
              </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-12 px-4">
              <div className="container mx-auto max-w-7xl">
                <div className="grid md:grid-cols-3 gap-8">
                  {plans.map((plan, index) => (
                    <div
                      key={index}
                      className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                        plan.highlighted
                          ? 'border-black bg-black text-white scale-105 shadow-2xl'
                          : 'border-border/70 bg-card hover:border-black'
                      }`}
                    >
                      {/* Badge Popular */}
                      {plan.highlighted && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-white text-black px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            Populaire
                          </div>
                        </div>
                      )}

                      {/* Plan Name */}
                      <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                        {plan.name}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                            {plan.price}
                          </span>
                          <span className={`text-lg ${plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {plan.currency}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${plan.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {plan.period}
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-3">
                            <Check
                              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                plan.highlighted ? 'text-white' : 'text-green-600'
                              }`}
                              strokeWidth={2}
                            />
                            <span className={`text-sm ${plan.highlighted ? 'text-white' : 'text-foreground/80'}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <a
                        href="/"
                        className={`block w-full text-center py-4 rounded-full font-semibold transition-all duration-300 ${
                          plan.highlighted
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {plan.cta}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4">
              <div className="container mx-auto max-w-4xl">
                <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
                  {t('pricing.faq.title', 'Questions Fréquentes')}
                </h2>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-card border border-border/70">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {t('pricing.faq.trial.question', 'Y a-t-il un essai gratuit ?')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('pricing.faq.trial.answer', 'Oui ! Tous nos plans incluent un essai gratuit de 14 jours. Aucune carte bancaire requise pour commencer.')}
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-card border border-border/70">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {t('pricing.faq.payment.question', 'Quels modes de paiement acceptez-vous ?')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('pricing.faq.payment.answer', 'Nous acceptons les paiements par Mobile Money (Orange Money, MTN Mobile Money), carte bancaire et virement bancaire.')}
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-card border border-border/70">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {t('pricing.faq.cancel.question', 'Puis-je annuler mon abonnement à tout moment ?')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('pricing.faq.cancel.answer', 'Absolument. Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun frais d\'annulation.')}
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-card border border-border/70">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {t('pricing.faq.upgrade.question', 'Puis-je changer de plan plus tard ?')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('pricing.faq.upgrade.answer', 'Oui ! Vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement.')}
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-card border border-border/70">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {t('pricing.faq.support.question', 'Le support est-il inclus ?')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('pricing.faq.support.answer', 'Oui ! Tous les plans incluent un support par email. Les plans Pro et Enterprise bénéficient d\'un support prioritaire et dédié.')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4">
              <div className="container mx-auto max-w-4xl">
                <div className="bg-black text-white rounded-3xl p-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    {t('pricing.cta.title', 'Besoin d\'un plan personnalisé ?')}
                  </h2>
                  <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                    {t('pricing.cta.description', 'Notre équipe est là pour vous aider à trouver la solution parfaite pour vos besoins spécifiques.')}
                  </p>
                  <a
                    href="mailto:contact@bedones.com"
                    className="inline-block bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {t('pricing.cta.button', 'Contactez-nous')}
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

export default PricingPage;
