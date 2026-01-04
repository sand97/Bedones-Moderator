import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const CustomErrorComponent = ({ statusCode }: ErrorProps) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Set locale from router
    const locale = router.locale || 'fr';
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [router.locale, i18n]);

  // Use custom pages for known status codes
  if (statusCode === 404) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-9xl font-bold text-foreground">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">
              {t('errors.404.title')}
            </h2>
          </div>
          <p className="text-muted-foreground">{t('errors.404.message')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              {t('errors.404.goHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // For 500 and other server errors
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-foreground">{statusCode}</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('errors.500.title')}
          </h2>
        </div>
        <p className="text-muted-foreground">{t('errors.500.message')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            {t('errors.500.tryAgain')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('errors.500.goHome')}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('errors.500.contactSupport')}
        </p>
      </div>
    </div>
  );
};

CustomErrorComponent.getInitialProps = async (
  contextData: NextPageContext,
): Promise<ErrorProps> => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  const statusCode = contextData.res?.statusCode || contextData.err?.statusCode || 404;

  return {
    statusCode,
    hasGetInitialPropsRun: true,
    err: contextData.err,
  };
};

export default CustomErrorComponent;
