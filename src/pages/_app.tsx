import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import type { ReactElement, ReactNode } from 'react';

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
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      <Toaster />
    </>
  );
}) as AppType;

export default trpc.withTRPC(MyApp);
