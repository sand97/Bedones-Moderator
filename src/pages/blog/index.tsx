import type { GetStaticProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getAllArticles, BlogArticle } from '~/lib/blog';
import { useTranslation } from 'react-i18next';
import SEO from '~/components/SEO';
import JsonLd from '~/components/JsonLd';

interface BlogPageProps {
  articles: BlogArticle[];
}

export default function BlogPage({ articles }: BlogPageProps) {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t('blog.title', 'Blog - Conseils et Actualités')}
        description={t('blog.description', 'Découvrez nos articles sur la modération de commentaires, les meilleures pratiques et les actualités des réseaux sociaux.')}
      />
      <JsonLd type="website" />
      <div className="flex min-h-screen flex-col">
        <div className="app-grid-bg relative overflow-hidden flex-1 flex flex-col">
          <Header />

          <main className="flex-1">
            {/* Hero Section */}
            <section className="relative py-20 px-4">
            <div className="container mx-auto max-w-6xl text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t('blog.hero.title', 'Blog')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('blog.hero.subtitle', 'Conseils, astuces et actualités sur la modération de commentaires')}
              </p>
            </div>
          </section>

            {/* Articles Grid */}
            <section className="py-16 px-4">
              <div className="container mx-auto max-w-6xl">
                {articles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {t('blog.noArticles', 'Aucun article disponible pour le moment.')}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group"
                      >
                        <article className="h-full flex flex-col rounded-3xl border border-border/70 bg-card p-4 transition-colors duration-200 hover:border-black">
                          <div className="relative mb-4 h-48 overflow-hidden rounded-lg">
                            <Image
                              src={article.image}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="inline-flex w-fit items-center gap-2 mb-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              {article.category}
                            </div>
                            <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                              {article.title}
                            </h2>
                            <p className="text-muted-foreground mb-4 flex-1 line-clamp-3">
                              {article.excerpt}
                            </p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{article.author.name}</span>
                              <span>{article.readTime}</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>

        <Footer />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const articles = getAllArticles();

  return {
    props: {
      articles,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
};
