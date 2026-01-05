import type { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getArticleBySlug, getAllSlugs, getAllArticles, BlogArticle } from '~/lib/blog';
import { ArrowLeft, Calendar, Clock, User, Link2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import SEO from '~/components/SEO';
import JsonLd from '~/components/JsonLd';
import { useState, useEffect } from 'react';

interface BlogArticlePageProps {
  article: BlogArticle | null;
  relatedArticles: BlogArticle[];
}

// Fonction pour générer un slug à partir du texte
function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Composant H2 avec lien cliquable
function H2WithLink({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : '');
  const id = generateSlug(text);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    window.history.pushState(null, '', `#${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <h2 id={id} className="text-3xl font-bold mt-12 mb-6 text-foreground scroll-mt-20 group relative">
      {children}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copier le lien"
        type="button"
      >
        <Link2 className="w-5 h-5 text-primary hover:text-primary/80" />
        {copied && (
          <span className="absolute -top-8 left-0 bg-foreground text-background px-2 py-1 rounded text-sm whitespace-nowrap">
            Lien copié !
          </span>
        )}
      </button>
    </h2>
  );
}

export default function BlogArticlePage({ article, relatedArticles }: BlogArticlePageProps) {
  const { t } = useTranslation();

  // Gestion du scroll vers l'ancre au chargement de la page
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('blog.notFound.title', 'Article non trouvé')}</h1>
            <Link href="/blog" className="text-primary hover:underline">
              {t('blog.notFound.back', 'Retour au blog')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.image}
        article={true}
        publishedTime={article.publishedAt}
        author={article.author.name}
      />
      <JsonLd type="article" data={{ article }} />
      <div className="flex min-h-screen flex-col relative">
        <div className="absolute top-0 left-0 right-0 z-50 py-4">
          <Header variant="transparent" />
        </div>

        <main className="flex-1">
          {/* Hero Image */}
          <div className="relative h-[50vh] overflow-hidden">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container mx-auto max-w-4xl">
                <Link
                  href="/blog"
                  className="inline-flex items-center text-white hover:text-white/80 mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('blog.article.back', 'Retour au blog')}
                </Link>

                <div className="inline-block ml-2 mb-4 px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                  {article.category}
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {article.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-white/90 text-sm">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {article.author.name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {article.readTime}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="container mx-auto max-w-4xl py-12 px-4">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <H2WithLink>{children}</H2WithLink>,
                  h3: ({ children }) => (
                    <h3 className="text-2xl font-bold mt-8 mb-4 text-foreground scroll-mt-20">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-base leading-relaxed mb-6 text-foreground/90">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-6 list-disc pl-6 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-6 list-decimal pl-6 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground/90">
                      {children}
                    </li>
                  ),
                  code: ({ inline, children }) => {
                    if (inline) {
                      return (
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-muted border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono my-6">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-6">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-foreground/80">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-primary underline font-medium hover:text-primary/80 transition-colors"
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="my-8 overflow-x-auto">
                      <table className="w-full border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="border-b-2 border-border bg-muted/50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody>
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="transition-colors hover:bg-muted/30">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 border-b border-border text-foreground/90">
                      {children}
                    </td>
                  ),
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || ''}
                      className="rounded-lg my-8 w-full"
                    />
                  ),
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>

            {/* Author Bio */}
            <div className="mt-12 p-6 bg-muted rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {article.author.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{article.author.name}</h3>
                  <p className="text-muted-foreground">{article.author.role}</p>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-16">
                <h2 className="text-3xl font-bold mb-8">
                  {t('blog.article.related', 'Articles similaires')}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <Link
                      key={relatedArticle.slug}
                      href={`/blog/${relatedArticle.slug}`}
                      className="group"
                    >
                      <article className="h-full flex flex-col rounded-3xl border border-border/70 bg-card p-4 transition-colors duration-200 hover:border-black">
                        <div className="relative mb-4 h-40 overflow-hidden rounded-lg">
                          <Image
                            src={relatedArticle.image}
                            alt={relatedArticle.title}
                            fill
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          />
                        </div>
                        <div className="inline-flex w-fit items-center gap-2 mb-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {relatedArticle.category}
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {relatedArticle.excerpt}
                        </p>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BlogArticlePageProps, { slug: string }> = async ({
  params,
}) => {
  if (!params?.slug) {
    return {
      notFound: true,
    };
  }

  const article = getArticleBySlug(params.slug);

  if (!article) {
    return {
      notFound: true,
    };
  }

  const allArticles = getAllArticles();
  const relatedArticles = allArticles
    .filter((a) => a.slug !== params.slug && a.category === article.category)
    .slice(0, 3);

  return {
    props: {
      article,
      relatedArticles,
    },
    revalidate: 60,
  };
};
