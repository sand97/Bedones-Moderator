import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GeistSans } from 'geist/font/sans';

import { DefaultLayout } from '~/components/DefaultLayout';
import { AnalyticsIdentifier } from '~/components/AnalyticsIdentifier';
import { PurchaseTracker } from '~/components/PurchaseTracker';
import { Toaster } from '~/components/ui/toaster';
import { trpc } from '~/utils/trpc';
import '~/styles/globals.css';
import '~/lib/i18n';

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = (({ Component, pageProps }: AppPropsWithLayout) => {
  const router = useRouter();
  const { i18n } = useTranslation();
  const locale = router.locale ?? router.defaultLocale ?? 'fr';

  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  // Restore language preference from localStorage after OAuth login
  useEffect(() => {
    const preferredLocale = localStorage.getItem('preferredLocale');
    const currentLocale = locale;

    // If user has a saved locale preference and it differs from current locale
    if (preferredLocale && preferredLocale !== currentLocale) {
      // Clear the preference to avoid infinite redirects
      localStorage.removeItem('preferredLocale');

      // Redirect to the preferred locale
      router.push(router.pathname, router.asPath, { locale: preferredLocale });
    }
  }, [router, locale]);

  return (
    <div className={GeistSans.className}>
      <AnalyticsIdentifier />
      <PurchaseTracker />
      {getLayout(<Component {...pageProps} />)}
      <Toaster />
      <GoogleAnalytics gaId="G-ZEJZ4EPXE9" />
    </div>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
