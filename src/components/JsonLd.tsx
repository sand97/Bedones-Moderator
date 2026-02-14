import Head from 'next/head';
import { useRouter } from 'next/router';

interface JsonLdProps {
  type?: 'website' | 'article' | 'organization' | 'faq' | 'product';
  data?: any;
}

export default function JsonLd({ type = 'website', data = {} }: JsonLdProps) {
  const router = useRouter();
  const locale = router.locale || 'fr';
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    sameAs: [
      // Add your social media links here
      // 'https://www.facebook.com/moderateurbedones',
      // 'https://twitter.com/moderateurbedones',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'contact@bedones.com',
      availableLanguage: ['French', 'English'],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
    url: siteUrl,
    description:
      locale === 'fr'
        ? 'Plateforme de modération intelligente pour Facebook et Instagram avec IA'
        : 'Smart moderation platform for Facebook and Instagram with AI',
    inLanguage: [locale],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
    url: siteUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      locale === 'fr'
        ? 'Outil de modération automatique pour les commentaires Facebook et Instagram avec intelligence artificielle'
        : 'Automatic moderation tool for Facebook and Instagram comments with artificial intelligence',
    offers: {
      '@type': 'Offer',
      category: 'SaaS',
      itemOffered: {
        '@type': 'Service',
        name: 'Comment Moderation Service',
        description:
          locale === 'fr'
            ? 'Service complet de modération de commentaires avec IA'
            : 'Complete AI-powered comment moderation service',
        provider: {
          '@type': 'Organization',
          name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
        },
      },
    },
  };

  const articleSchema = data.article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.article.title,
        description: data.article.excerpt,
        image: `${siteUrl}${data.article.image}`,
        datePublished: data.article.publishedAt,
        dateModified: data.article.publishedAt,
        author: {
          '@type': 'Person',
          name: data.article.author?.name || 'Moderateur Bedones',
        },
        publisher: {
          '@type': 'Organization',
          name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/logo.svg`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${siteUrl}${router.asPath}`,
        },
        inLanguage: locale,
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'fr' ? 'Accueil' : 'Home',
        item: siteUrl,
      },
      ...(router.pathname.includes('/blog')
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: `${siteUrl}/blog`,
            },
          ]
        : []),
      ...(router.pathname.includes('/dashboard')
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Dashboard',
              item: `${siteUrl}/dashboard`,
            },
          ]
        : []),
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Comment fonctionne la modération automatique des commentaires ?'
            : 'How does automatic comment moderation work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'Moderateur Bedones utilise l\'intelligence artificielle pour analyser en temps réel tous les commentaires sur vos publications Facebook et Instagram. Le système détecte automatiquement le spam, les commentaires indésirables et peut répondre automatiquement aux questions fréquentes grâce à la FAQ intelligente.'
              : 'Moderateur Bedones uses artificial intelligence to analyze in real-time all comments on your Facebook and Instagram posts. The system automatically detects spam, unwanted comments and can automatically respond to frequently asked questions through the intelligent FAQ.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Quelles plateformes sont supportées ?'
            : 'Which platforms are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'Moderateur Bedones supporte actuellement Facebook et Instagram. Vous pouvez connecter vos pages Facebook et vos comptes professionnels Instagram pour une modération complète.'
              : 'Moderateur Bedones currently supports Facebook and Instagram. You can connect your Facebook pages and Instagram business accounts for complete moderation.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Comment fonctionne la détection de spam ?'
            : 'How does spam detection work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'Notre système d\'IA analyse les commentaires pour détecter les caractéristiques typiques du spam : liens suspects, répétitions excessives, contenu promotionnel non sollicité, etc. Les commentaires identifiés comme spam peuvent être automatiquement supprimés ou masqués selon vos préférences.'
              : 'Our AI system analyzes comments to detect typical spam characteristics: suspicious links, excessive repetitions, unsolicited promotional content, etc. Comments identified as spam can be automatically deleted or hidden according to your preferences.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Qu\'est-ce que la FAQ intelligente ?'
            : 'What is the intelligent FAQ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'La FAQ intelligente permet de configurer des questions-réponses automatiques. Lorsqu\'un utilisateur pose une question similaire à celles configurées, le système répond automatiquement avec la réponse appropriée, vous faisant gagner un temps précieux.'
              : 'The intelligent FAQ allows you to configure automatic question-answer pairs. When a user asks a question similar to those configured, the system automatically responds with the appropriate answer, saving you valuable time.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Est-ce que mes données sont sécurisées ?'
            : 'Is my data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'Oui, nous prenons la sécurité très au sérieux. Toutes les données sont chiffrées en transit et au repos. Nous respectons strictement le RGPD et ne stockons que les informations nécessaires au fonctionnement du service. Vos identifiants Facebook et Instagram sont sécurisés via OAuth 2.0.'
              : 'Yes, we take security very seriously. All data is encrypted in transit and at rest. We strictly comply with GDPR and only store information necessary for the service to function. Your Facebook and Instagram credentials are secured via OAuth 2.0.',
        },
      },
      {
        '@type': 'Question',
        name:
          locale === 'fr'
            ? 'Comment puis-je commencer à utiliser Moderateur Bedones ?'
            : 'How can I start using Moderateur Bedones?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            locale === 'fr'
              ? 'C\'est très simple ! Connectez votre page Facebook ou compte Instagram, configurez vos préférences de modération (commentaires indésirables, détection de spam, FAQ), et le système commence immédiatement à surveiller et modérer vos commentaires automatiquement.'
              : 'It\'s very simple! Connect your Facebook page or Instagram account, configure your moderation preferences (unwanted comments, spam detection, FAQ), and the system immediately starts monitoring and moderating your comments automatically.',
        },
      },
    ],
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: locale === 'fr' ? 'Moderateur Bedones' : 'Moderateur Bedones',
    description:
      locale === 'fr'
        ? 'Plateforme SaaS de modération intelligente pour les commentaires Facebook et Instagram avec intelligence artificielle'
        : 'Smart SaaS moderation platform for Facebook and Instagram comments with artificial intelligence',
    brand: {
      '@type': 'Brand',
      name: 'Bedones',
    },
    category: 'Software',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    url: siteUrl,
    image: `${siteUrl}/og-image.jpg`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'XAF',
      lowPrice: '5000',
      highPrice: '50000',
      offerCount: '3',
      availability: 'https://schema.org/InStock',
      url: siteUrl,
      priceSpecification: [
        {
          '@type': 'UnitPriceSpecification',
          price: '5000',
          priceCurrency: 'XAF',
          name: locale === 'fr' ? 'Plan Starter' : 'Starter Plan',
          billingDuration: 'P1M',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: '15000',
          priceCurrency: 'XAF',
          name: locale === 'fr' ? 'Plan Pro' : 'Pro Plan',
          billingDuration: 'P1M',
        },
        {
          '@type': 'UnitPriceSpecification',
          price: '50000',
          priceCurrency: 'XAF',
          name: locale === 'fr' ? 'Plan Enterprise' : 'Enterprise Plan',
          billingDuration: 'P1M',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      locale === 'fr' ? 'Modération automatique des commentaires' : 'Automatic comment moderation',
      locale === 'fr' ? 'Détection de spam par IA' : 'AI-powered spam detection',
      locale === 'fr' ? 'FAQ intelligente automatique' : 'Intelligent automatic FAQ',
      locale === 'fr' ? 'Support Facebook et Instagram' : 'Facebook and Instagram support',
      locale === 'fr' ? 'Surveillance en temps réel' : 'Real-time monitoring',
      locale === 'fr' ? 'Actions en masse' : 'Bulk actions',
      locale === 'fr' ? 'Statistiques détaillées' : 'Detailed statistics',
      locale === 'fr' ? 'Multi-comptes' : 'Multi-account support',
    ],
    audience: {
      '@type': 'Audience',
      audienceType: locale === 'fr' ? 'Entreprises et créateurs de contenu' : 'Businesses and content creators',
    },
    award:
      locale === 'fr'
        ? 'Plateforme innovante de modération IA 2024'
        : 'Innovative AI Moderation Platform 2024',
  };

  let schema: any;
  switch (type) {
    case 'article':
      schema = articleSchema;
      break;
    case 'organization':
      schema = [organizationSchema, softwareApplicationSchema];
      break;
    case 'faq':
      schema = [faqSchema, organizationSchema];
      break;
    case 'product':
      schema = [productSchema, organizationSchema, faqSchema];
      break;
    default:
      schema = [websiteSchema, breadcrumbSchema, organizationSchema];
  }

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Head>
  );
}
