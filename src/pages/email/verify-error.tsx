/**
 * Email Verification Error Page
 * Shows error message when email verification fails
 */

import { useRouter } from 'next/router';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '~/components/ui/button.tsx';

export default function VerifyErrorPage() {
  const router = useRouter();
  const reason = router.query.reason as string;

  const getErrorMessage = () => {
    switch (reason) {
      case 'expired':
        return 'Ce lien de vérification a expiré. Veuillez demander un nouveau lien de vérification depuis votre compte.';
      case 'invalid':
        return 'Lien de vérification invalide.';
      case 'not-found':
        return 'Utilisateur introuvable.';
      default:
        return 'Une erreur s\'est produite lors de la vérification de votre email. Veuillez réessayer plus tard.';
    }
  };

  return (
    <div className="min-h-screen app-grid-bg relative overflow-hidden">
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8">
        {/* Logo - tout en haut */}
        <div className="flex justify-center pt-4 pb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
            <span className="text-xl font-semibold text-white">B</span>
          </div>
        </div>

        {/* Content centré */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Error Icon */}
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {reason === 'expired' ? 'Lien expiré' : 'Erreur'}
            </h1>

            {/* Message */}
            <p className="text-base text-gray-600">{getErrorMessage()}</p>

            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/dashboard/account">
                <Button className="w-full sm:w-auto" size="lg" variant="outline">
                  Aller aux paramètres du compte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
