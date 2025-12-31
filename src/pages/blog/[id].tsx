import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from '~/components/Header';
import { Button } from '~/components/ui/button';
import { Calendar, User, Clock, ArrowLeft } from 'lucide-react';
import type { NextPageWithLayout } from '../_app';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
}

const blogPosts: Record<string, BlogPost> = {
  '1': {
    id: '1',
    title: 'Comment modérer efficacement vos commentaires Facebook avec l\'IA',
    content: `
      <h2>Introduction</h2>
      <p>La modération des commentaires sur les réseaux sociaux est devenue un défi majeur pour les entreprises et les créateurs de contenu. Avec des milliers de commentaires quotidiens, il est impossible de tout surveiller manuellement.</p>

      <h2>L'intelligence artificielle à la rescousse</h2>
      <p>Notre solution utilise des algorithmes d'IA avancés pour analyser chaque commentaire en temps réel. L'IA est capable de détecter :</p>
      <ul>
        <li>Les insultes et le langage inapproprié</li>
        <li>Les contenus promotionnels non sollicités (spam)</li>
        <li>Les liens suspects et potentiellement dangereux</li>
        <li>Les messages répétitifs</li>
      </ul>

      <h2>Configuration simple et rapide</h2>
      <p>En quelques clics, vous pouvez connecter vos pages Facebook et activer les fonctionnalités de modération :</p>
      <ol>
        <li>Connectez votre page Facebook</li>
        <li>Activez la détection des commentaires indésirables</li>
        <li>Choisissez l'action à effectuer (masquer ou supprimer)</li>
        <li>Laissez l'IA travailler pour vous !</li>
      </ol>

      <h2>Résultats mesurables</h2>
      <p>Nos utilisateurs constatent en moyenne une réduction de 90% du temps passé à modérer leurs commentaires, tout en maintenant une communauté saine et engagée.</p>

      <h2>Conclusion</h2>
      <p>La modération automatisée n'est plus une option, c'est une nécessité. Commencez dès aujourd'hui à protéger votre marque et votre communauté avec Bedones Moderator.</p>
    `,
    date: '2025-01-15',
    author: 'Bedones Team',
    category: 'Guide',
    readTime: '5 min',
  },
  '2': {
    id: '2',
    title: 'Les meilleures pratiques pour gérer votre communauté Instagram',
    content: `
      <h2>Construire une communauté engagée</h2>
      <p>Instagram est une plateforme visuelle où l'engagement de la communauté est essentiel. Une modération efficace vous aide à maintenir un environnement positif.</p>

      <h2>Pratique #1 : Répondre rapidement</h2>
      <p>Utilisez notre fonctionnalité de FAQ intelligente pour répondre automatiquement aux questions fréquentes. Cela montre à votre communauté que vous êtes présent et à l'écoute.</p>

      <h2>Pratique #2 : Filtrer le spam</h2>
      <p>Les comptes Instagram sont souvent ciblés par des spammeurs. Notre IA détecte et filtre automatiquement ces messages indésirables.</p>

      <h2>Pratique #3 : Gérer les commentaires négatifs</h2>
      <p>Les commentaires négatifs font partie du jeu, mais les insultes et le harcèlement n'ont pas leur place. Notre système vous aide à maintenir cette limite.</p>

      <h2>Conclusion</h2>
      <p>Une communauté bien gérée est une communauté qui grandit. Utilisez les outils de modération pour vous concentrer sur la création de contenu de qualité.</p>
    `,
    date: '2025-01-10',
    author: 'Bedones Team',
    category: 'Conseils',
    readTime: '7 min',
  },
  '3': {
    id: '3',
    title: 'Détection de spam : Comment ça fonctionne ?',
    content: `
      <h2>La technologie derrière la détection</h2>
      <p>Notre système de détection de spam utilise plusieurs techniques d'apprentissage automatique pour identifier les contenus indésirables.</p>

      <h2>Analyse de patterns</h2>
      <p>L'IA analyse des millions de commentaires pour identifier les patterns caractéristiques du spam :</p>
      <ul>
        <li>Messages répétitifs</li>
        <li>Liens raccourcis suspects</li>
        <li>Emojis excessifs</li>
        <li>Mots-clés promotionnels</li>
      </ul>

      <h2>Traitement en temps réel</h2>
      <p>Chaque commentaire est analysé en quelques millisecondes grâce à notre infrastructure optimisée. L'action (masquer ou supprimer) est effectuée automatiquement selon vos préférences.</p>

      <h2>Amélioration continue</h2>
      <p>Notre modèle d'IA s'améliore constamment en apprenant de nouveaux patterns de spam, garantissant une protection toujours plus efficace.</p>

      <h2>Conclusion</h2>
      <p>La détection de spam est un processus complexe, mais notre technologie le rend simple et transparent pour vous.</p>
    `,
    date: '2025-01-05',
    author: 'Bedones Team',
    category: 'Technique',
    readTime: '6 min',
  },
};

const BlogPostPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  const post = id ? blogPosts[id as string] : null;

  if (!post && router.isReady) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article non trouvé</h1>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{post.title} - Bedones Moderator</title>
        <meta name="description" content={post.title} />
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px]">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au blog
            </Button>
          </Link>

          <article className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <div className="mb-6">
              <span className="inline-block bg-black text-white text-xs px-3 py-1 rounded mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(post.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {post.readTime} de lecture
                </span>
              </div>
            </div>

            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-12 pt-8 border-t">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">
                  Prêt à essayer Bedones Moderator ?
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez à modérer vos commentaires automatiquement dès
                  aujourd'hui.
                </p>
                <Link href="/">
                  <Button>Commencer gratuitement</Button>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;
