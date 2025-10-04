import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DefaultLayout } from '~/components/DefaultLayout';
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

  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  // Sync i18next with Next.js router locale
  useEffect(() => {
    const locale = router.locale || 'fr';
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [router.locale, i18n]);

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      <Toaster />
    </>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
