import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export function UpgradeCard() {
  const { t } = useTranslation();

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-gray-700 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
            <Sparkles className="size-6 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-white">
              {t('upgrade.title')}
            </h3>
            <p className="text-sm text-gray-300">
              {t('upgrade.description')}
            </p>
            <Link href="/dashboard/payment-method">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                {t('upgrade.cta')}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
