import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { FileText, Shield, CreditCard, ArrowRight } from 'lucide-react';
import type { NextPageWithLayout } from './_app';

const LegalPage: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>Mentions Légales - Bedones Moderator</title>
        <meta
          name="description"
          content="Consultez nos mentions légales, conditions d'utilisation et politique de confidentialité"
        />
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px]">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black text-white mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              Mentions Légales
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Consultez l'ensemble de nos documents légaux pour comprendre vos
              droits et nos engagements
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {/* CGU Card */}
            <Card className="hover:shadow-lg transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black/5 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  Conditions Générales d'Utilisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Découvrez les règles d'utilisation de notre service, vos
                  droits et obligations en tant qu'utilisateur.
                </p>
                <Link href="/terms">
                  <Button variant="outline" className="w-full group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                    Consulter les CGU
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Privacy Policy Card */}
            <Card className="hover:shadow-lg transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black/5 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  Politique de Confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Comprenez comment nous collectons, utilisons et protégeons
                  vos données personnelles.
                </p>
                <Link href="/privacy">
                  <Button variant="outline" className="w-full group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                    Voir la politique
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* CGV Card */}
            <Card className="hover:shadow-lg transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-black/5 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  Conditions Générales de Vente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Consultez nos conditions de vente, tarifs, modalités de
                  paiement et de remboursement.
                </p>
                <Link href="/cgv">
                  <Button variant="outline" className="w-full group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                    Consulter les CGV
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-2xl">Informations Légales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Éditeur du site</h3>
                <p className="text-gray-600">
                  Bedones Moderator
                  <br />
                  Siège social : Yaoundé, Cameroun
                  <br />
                  Email : contact@bedones.com
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Hébergement</h3>
                <p className="text-gray-600">
                  Ce site est hébergé par Cloudflare Pages
                  <br />
                  Cloudflare, Inc.
                  <br />
                  101 Townsend St, San Francisco, CA 94107, États-Unis
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Propriété intellectuelle</h3>
                <p className="text-gray-600">
                  L'ensemble du contenu de ce site (textes, images, vidéos,
                  logos) est la propriété exclusive de Bedones et est protégé
                  par les lois sur la propriété intellectuelle.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact</h3>
                <p className="text-gray-600">
                  Pour toute question concernant ces mentions légales :
                  <br />
                  Email : legal@bedones.com
                  <br />
                  Support : support@bedones.com
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Last Update Info */}
          <div className="text-center mt-8 text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalPage;
