import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const defaultMeta = {
  fr: {
    title: 'Moderateur Bedones - Modération Intelligente pour Facebook & Instagram',
    description:
      'Gérez et modérez automatiquement vos commentaires Facebook et Instagram avec l\'intelligence artificielle. Détection de spam, FAQ automatique et modération avancée.',
    siteName: 'Moderateur Bedones',
  },
  en: {
    title: 'Moderateur Bedones - Smart Moderation for Facebook & Instagram',
    description:
      'Manage and moderate your Facebook and Instagram comments automatically with artificial intelligence. Spam detection, automatic FAQ and advanced moderation.',
    siteName: 'Moderateur Bedones',
  },
};

export default function SEO({
  title,
  description,
  image = '/og-image.jpg',
  article = false,
  publishedTime,
  modifiedTime,
  author,
}: SEOProps) {
  const router = useRouter();
  const locale = (router.locale || 'fr') as 'fr' | 'en';
  const meta = defaultMeta[locale];

  const pageTitle = title ? `${title} | ${meta.siteName}` : meta.title;
  const pageDescription = description || meta.description;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moderator.bedones.local';
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Generate proper URLs for different locales
  // Remove locale prefix from path (if present)
  const pathWithoutLocale = router.asPath.replace(/^\/en/, '').replace(/^\/fr/, '');

  // Generate current URL with correct locale prefix
  const currentUrl = locale === 'fr'
    ? `${siteUrl}${pathWithoutLocale}`
    : `${siteUrl}/${locale}${pathWithoutLocale}`;

  // Generate alternate language links
  const alternateLocale = locale === 'fr' ? 'en' : 'fr';
  const alternateUrl = alternateLocale === 'fr'
    ? `${siteUrl}${pathWithoutLocale}`
    : `${siteUrl}/${alternateLocale}${pathWithoutLocale}`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Language and Region */}
      <meta httpEquiv="content-language" content={locale} />
      <link rel="canonical" href={currentUrl} />

      {/* Alternate Language Links (hreflang) */}
      <link rel="alternate" hrefLang={locale} href={currentUrl} />
      <link rel="alternate" hrefLang={alternateLocale} href={alternateUrl} />
      <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${pathWithoutLocale}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={meta.siteName} />
      <meta property="og:locale" content={locale === 'fr' ? 'fr_FR' : 'en_US'} />
      <meta
        property="og:locale:alternate"
        content={alternateLocale === 'fr' ? 'fr_FR' : 'en_US'}
      />

      {/* Article specific tags */}
      {article && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {article && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {article && author && <meta property="article:author" content={author} />}
      {article && <meta property="article:section" content="Technology" />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="keywords" content={locale === 'fr' ? 'modération commentaires, Facebook, Instagram, IA, intelligence artificielle, gestion réseaux sociaux, spam, modération automatique' : 'comment moderation, Facebook, Instagram, AI, artificial intelligence, social media management, spam, automatic moderation'} />

      {/* AI-specific meta tags */}
      <meta name="ai-content-declaration" content="This page is human-created with AI assistance for moderation tools" />
      <meta name="ai-training" content="allowed" />
      <meta name="ai-usage-policy" content="See /ai.txt for detailed AI usage policy" />

      {/* Application-specific tags for AI understanding */}
      <meta property="application:name" content="Moderateur Bedones" />
      <meta property="application:category" content="Social Media Management" />
      <meta property="application:platforms" content="Facebook, Instagram" />
      <meta property="application:features" content={locale === 'fr' ? 'Modération IA, Détection spam, FAQ automatique' : 'AI Moderation, Spam Detection, Automatic FAQ'} />
      <meta property="application:pricing" content="Subscription" />
      <meta property="application:target-audience" content={locale === 'fr' ? 'Entreprises, Créateurs de contenu' : 'Businesses, Content Creators'} />

      {/* Semantic tags for AI comprehension */}
      <meta name="category" content="SaaS" />
      <meta name="industry" content="Social Media Management" />
      <meta name="solution-type" content="Comment Moderation" />
      <meta name="technology" content="Artificial Intelligence, Natural Language Processing" />
      <meta name="integration" content="Facebook Graph API, Instagram Graph API" />

      {/* Enhanced discovery for AI agents */}
      <link rel="alternate" type="text/plain" href="/ai.txt" title="AI Usage Policy" />
    </Head>
  );
}
