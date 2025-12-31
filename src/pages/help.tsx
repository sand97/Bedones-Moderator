import Head from 'next/head';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { HelpCircle, MessageSquare, FileQuestion } from 'lucide-react';
import { useSession } from '~/lib/auth-client';
import * as Sentry from '@sentry/nextjs';
import type { NextPageWithLayout } from './_app';

const HelpPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Sentry User Feedback widget
    if (typeof window !== 'undefined' && feedbackRef.current) {
      const feedback = Sentry.getFeedback();

      if (feedback) {
        feedback.attachTo(feedbackRef.current, {
          formTitle: 'Besoin d\'aide ?',
          submitButtonLabel: 'Envoyer',
          cancelButtonLabel: 'Annuler',
          confirmButtonLabel: 'Confirmer',
          addScreenshotButtonLabel: 'Ajouter une capture d\'écran',
          removeScreenshotButtonLabel: 'Retirer la capture d\'écran',
          nameLabel: 'Nom',
          namePlaceholder: 'Votre nom',
          emailLabel: 'Email',
          emailPlaceholder: 'votre.email@example.com',
          isRequiredLabel: '(requis)',
          messageLabel: 'Description du problème',
          messagePlaceholder: 'Décrivez votre problème ou votre question...',
          successMessageText: 'Merci pour votre retour ! Nous reviendrons vers vous rapidement.',
          autoInject: false,
        });
      }
    }
  }, []);

  const handleOpenFeedback = () => {
    const feedback = Sentry.getFeedback();
    if (feedback) {
      feedback.createForm();
      feedback.openDialog();
    }
  };

  return (
    <>
      <Head>
        <title>Aide - Bedones Moderator</title>
        <meta
          name="description"
          content="Besoin d'aide ? Contactez notre équipe de support"
        />
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px]">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              Centre d'aide
            </h1>
            <p className="text-lg text-gray-600">
              Nous sommes là pour vous aider. Consultez nos ressources ou
              contactez-nous directement.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileQuestion className="w-6 h-6 text-black" />
                  <CardTitle>Documentation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Consultez notre documentation complète pour apprendre à
                  utiliser toutes les fonctionnalités de Bedones Moderator.
                </p>
                <Button variant="outline" className="w-full">
                  Voir la documentation
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6 text-black" />
                  <CardTitle>FAQ</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Trouvez rapidement des réponses aux questions les plus
                  fréquemment posées par nos utilisateurs.
                </p>
                <Button variant="outline" className="w-full">
                  Consulter la FAQ
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-black to-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">
                Vous n'avez pas trouvé de réponse ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-6">
                Notre équipe de support est disponible pour répondre à toutes
                vos questions. Décrivez votre problème et nous vous
                contacterons rapidement.
              </p>
              <div ref={feedbackRef} className="mb-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full md:w-auto"
                  onClick={handleOpenFeedback}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contacter le support
                </Button>
              </div>
              {session?.user && (
                <p className="text-sm text-gray-300">
                  Connecté en tant que {session.user.email}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Common Issues Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Problèmes courants</h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    Mes commentaires ne sont pas détectés
                  </h3>
                  <p className="text-gray-600">
                    Assurez-vous que vous avez bien activé les webhooks pour
                    votre page Facebook ou compte Instagram. Vérifiez également
                    que les permissions nécessaires ont été accordées.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    Comment modifier mes paramètres de modération ?
                  </h3>
                  <p className="text-gray-600">
                    Rendez-vous dans les sections Facebook ou Instagram du
                    tableau de bord pour configurer vos préférences de
                    modération pour chaque page ou compte.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    Les FAQ automatiques ne fonctionnent pas
                  </h3>
                  <p className="text-gray-600">
                    Vérifiez que vous avez bien activé la fonctionnalité de FAQ
                    intelligente et que vos assertions sont clairement
                    définies. L'IA a besoin d'exemples précis pour comprendre
                    quand répondre.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpPage;
