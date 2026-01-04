/**
 * Email Verification Success Page
 * Shows success message after email verification
 */

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '~/components/ui/button.tsx';

export default function VerifySuccessPage() {
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
            {/* Success Icon */}
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Email vérifié avec succès !
            </h1>

            {/* Message */}
            <p className="text-base text-gray-600">
              Votre adresse email a été vérifiée. Vous pouvez maintenant recevoir des
              notifications et des astuces de modération.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto" size="lg">
                  Accéder au Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
