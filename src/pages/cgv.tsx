import Head from 'next/head';
import { Header } from '~/components/Header';
import { Card, CardContent } from '~/components/ui/card';
import type { NextPageWithLayout } from './_app';

const CGVPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Conditions Générales de Vente - Bedones Moderator</title>
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 pb-12 max-w-4xl relative z-10">
          <Card>
            <CardContent className="p-8 prose prose-sm max-w-none">
              <h1 className="text-3xl font-bold mb-6">
                Conditions Générales de Vente
              </h1>
              <p className="text-gray-600 mb-6">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  1. Objet et Champ d'Application
                </h2>
                <p className="mb-4">
                  Les présentes Conditions Générales de Vente (CGV) régissent
                  les relations contractuelles entre Bedones Moderator
                  ("nous", "notre") et tout client ("vous", "votre")
                  souscrivant à nos services payants de modération automatisée
                  de commentaires sur les réseaux sociaux.
                </p>
                <p className="mb-4">
                  En souscrivant à nos services payants, vous acceptez sans
                  réserve les présentes CGV.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  2. Services Proposés
                </h2>
                <p className="mb-4">Bedones Moderator propose :</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Modération automatisée des commentaires sur Facebook et
                    Instagram
                  </li>
                  <li>Détection et filtrage de spam et contenus indésirables</li>
                  <li>Réponses automatiques intelligentes aux questions fréquentes</li>
                  <li>Accès au tableau de bord analytique</li>
                  <li>Support technique et assistance</li>
                </ul>
                <p className="mb-4">
                  Les services sont fournis selon plusieurs formules
                  d'abonnement détaillées sur notre page de tarification.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Tarifs</h2>
                <p className="mb-4">
                  <strong>3.1 Prix</strong>
                </p>
                <p className="mb-4">
                  Les prix de nos services sont indiqués en Francs CFA (XAF) ou
                  en Euros (EUR) selon votre localisation, toutes taxes
                  comprises (TTC).
                </p>
                <p className="mb-4">
                  Nous nous réservons le droit de modifier nos tarifs à tout
                  moment. Les modifications de prix ne s'appliquent pas aux
                  abonnements en cours.
                </p>
                <p className="mb-4">
                  <strong>3.2 Modalités de Paiement</strong>
                </p>
                <p className="mb-4">
                  Nous acceptons les paiements par :
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Carte bancaire via Stripe</li>
                  <li>Orange Money via Notch Pay</li>
                  <li>MTN Mobile Money via Notch Pay</li>
                </ul>
                <p className="mb-4">
                  Le paiement est exigible à la souscription de l'abonnement et
                  renouvelé automatiquement selon la périodicité choisie
                  (mensuelle ou annuelle).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  4. Durée et Renouvellement
                </h2>
                <p className="mb-4">
                  <strong>4.1 Durée</strong>
                </p>
                <p className="mb-4">
                  Les abonnements sont souscrits pour une durée déterminée
                  (mensuelle ou annuelle) et se renouvellent automatiquement à
                  leur échéance, sauf résiliation.
                </p>
                <p className="mb-4">
                  <strong>4.2 Renouvellement Automatique</strong>
                </p>
                <p className="mb-4">
                  Votre abonnement sera automatiquement renouvelé et votre
                  moyen de paiement sera débité à chaque période de
                  renouvellement, sauf si vous résiliez votre abonnement avant
                  la date de renouvellement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  5. Résiliation et Remboursement
                </h2>
                <p className="mb-4">
                  <strong>5.1 Résiliation par le Client</strong>
                </p>
                <p className="mb-4">
                  Vous pouvez résilier votre abonnement à tout moment depuis
                  votre tableau de bord. La résiliation prendra effet à la fin
                  de la période d'abonnement en cours.
                </p>
                <p className="mb-4">
                  <strong>5.2 Politique de Remboursement</strong>
                </p>
                <p className="mb-4">
                  Les paiements effectués ne sont pas remboursables, sauf en
                  cas de non-respect de nos obligations contractuelles ou en
                  cas de défaut majeur du service.
                </p>
                <p className="mb-4">
                  Un délai de rétractation de 14 jours s'applique
                  conformément à la législation en vigueur pour les nouveaux
                  clients.
                </p>
                <p className="mb-4">
                  <strong>5.3 Résiliation par Bedones</strong>
                </p>
                <p className="mb-4">
                  Nous nous réservons le droit de résilier votre abonnement en
                  cas de :
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Violation des Conditions Générales d'Utilisation</li>
                  <li>Défaut de paiement</li>
                  <li>Utilisation frauduleuse ou abusive du service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  6. Obligations du Client
                </h2>
                <p className="mb-4">En tant que client, vous vous engagez à :</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Fournir des informations exactes et à jour lors de votre
                    inscription et paiement
                  </li>
                  <li>
                    Maintenir la confidentialité de vos identifiants de
                    connexion
                  </li>
                  <li>
                    Utiliser le service conformément aux CGU et à la
                    législation applicable
                  </li>
                  <li>
                    Vous assurer que votre moyen de paiement dispose de fonds
                    suffisants
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  7. Garanties et Responsabilités
                </h2>
                <p className="mb-4">
                  <strong>7.1 Garantie de Service</strong>
                </p>
                <p className="mb-4">
                  Nous nous engageons à fournir un service de qualité et à
                  faire nos meilleurs efforts pour assurer une disponibilité
                  maximale. Toutefois, nous ne garantissons pas :
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Une disponibilité ininterrompue du service</li>
                  <li>Une détection à 100% de tous les contenus indésirables</li>
                  <li>
                    L'absence d'erreurs dans les modérations automatiques
                  </li>
                </ul>
                <p className="mb-4">
                  <strong>7.2 Limitation de Responsabilité</strong>
                </p>
                <p className="mb-4">
                  Notre responsabilité est limitée au montant total des
                  sommes versées par le client au cours des 12 derniers mois.
                </p>
                <p className="mb-4">
                  Nous ne saurions être tenus responsables des dommages
                  indirects, pertes de données, de revenus ou d'opportunités
                  commerciales.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  8. Protection des Données
                </h2>
                <p className="mb-4">
                  Le traitement de vos données personnelles et de paiement est
                  régi par notre{' '}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Politique de Confidentialité
                  </a>
                  .
                </p>
                <p className="mb-4">
                  Les données de paiement sont traitées de manière sécurisée
                  par nos prestataires de paiement (Stripe et Notch Pay) et ne
                  sont jamais stockées sur nos serveurs.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  9. Force Majeure
                </h2>
                <p className="mb-4">
                  Nous ne saurions être tenus responsables de tout retard ou
                  inexécution de nos obligations résultant d'événements de
                  force majeure tels que catastrophes naturelles, pannes de
                  réseau, cyberattaques, ou toute autre circonstance
                  indépendante de notre volonté.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  10. Modifications des CGV
                </h2>
                <p className="mb-4">
                  Nous nous réservons le droit de modifier les présentes CGV à
                  tout moment. Les modifications seront communiquées aux
                  clients par email ou via le service au moins 30 jours avant
                  leur entrée en vigueur.
                </p>
                <p className="mb-4">
                  La poursuite de l'utilisation du service après l'entrée en
                  vigueur des modifications vaut acceptation des nouvelles CGV.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  11. Droit Applicable et Juridiction
                </h2>
                <p className="mb-4">
                  Les présentes CGV sont régies par le droit français. Tout
                  litige relatif à leur interprétation ou exécution sera soumis
                  à la compétence exclusive des tribunaux français.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
                <p className="mb-4">
                  Pour toute question concernant ces CGV ou votre abonnement :
                </p>
                <p className="mb-4">
                  <strong>Bedones Moderator</strong>
                  <br />
                  Email: support@bedones.com
                  <br />
                  Email facturation: billing@bedones.com
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CGVPage;
