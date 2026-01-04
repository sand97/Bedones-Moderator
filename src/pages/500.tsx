import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function Custom500() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Set locale from router
    const locale = router.locale || 'fr';
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [router.locale, i18n]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-foreground">500</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('errors.500.title')}
          </h2>
        </div>

        {/* Error Message */}
        <p className="text-muted-foreground">
          {t('errors.500.message')}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('errors.500.tryAgain')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {t('errors.500.goHome')}
          </Link>
        </div>

        {/* Support Link */}
        <p className="text-sm text-muted-foreground">
          {t('errors.500.contactSupport')}
        </p>
      </div>
    </div>
  );
}
