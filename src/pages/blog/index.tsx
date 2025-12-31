import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import type { NextPageWithLayout } from '../_app';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
}

const BlogPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  // Static blog posts for now - can be replaced with CMS or database later
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Comment modérer efficacement vos commentaires Facebook avec l\'IA',
      excerpt:
        'Découvrez comment notre intelligence artificielle vous aide à filtrer automatiquement les commentaires indésirables et le spam sur vos pages Facebook.',
      date: '2025-01-15',
      author: 'Bedones Team',
      category: 'Guide',
      readTime: '5 min',
    },
    {
      id: '2',
      title: 'Les meilleures pratiques pour gérer votre communauté Instagram',
      excerpt:
        'Apprenez à utiliser les fonctionnalités de modération automatique pour maintenir une communauté saine et engagée sur Instagram.',
      date: '2025-01-10',
      author: 'Bedones Team',
      category: 'Conseils',
      readTime: '7 min',
    },
    {
      id: '3',
      title: 'Détection de spam : Comment ça fonctionne ?',
      excerpt:
        'Un aperçu technique de nos algorithmes de détection de spam et comment ils protègent votre marque des contenus malveillants.',
      date: '2025-01-05',
      author: 'Bedones Team',
      category: 'Technique',
      readTime: '6 min',
    },
  ];

  return (
    <>
      <Head>
        <title>Blog - Bedones Moderator</title>
        <meta
          name="description"
          content="Découvrez nos articles sur la modération intelligente des réseaux sociaux"
        />
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px]">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Actualités, guides et conseils pour une modération efficace de vos
              réseaux sociaux
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {post.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {post.readTime} de lecture
                    </span>
                    <Link href={`/blog/${post.id}`}>
                      <Button variant="ghost" size="sm">
                        Lire la suite
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <Card className="bg-black text-white">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-4">
                  Prêt à modérer vos réseaux sociaux ?
                </h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Commencez dès maintenant à utiliser Bedones Moderator pour
                  filtrer automatiquement les commentaires indésirables et le
                  spam.
                </p>
                <Link href="/">
                  <Button size="lg" variant="secondary">
                    Commencer gratuitement
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
