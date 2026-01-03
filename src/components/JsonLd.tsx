import Head from 'next/head';
import { useRouter } from 'next/router';

interface JsonLdProps {
  type?: 'website' | 'article' | 'organization';
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
    logo: `${siteUrl}/logo.png`,
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
            url: `${siteUrl}/logo.png`,
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

  let schema: any;
  switch (type) {
    case 'article':
      schema = articleSchema;
      break;
    case 'organization':
      schema = [organizationSchema, softwareApplicationSchema];
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
