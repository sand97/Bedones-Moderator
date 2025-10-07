import Head from 'next/head';
import type { ReactNode } from 'react';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Bedones | Moderator</title>
        <meta
          name="description"
          content="Detect and hide/remove bad comment in your social media pages with IA"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="h-screen">{children}</main>
    </>
  );
};
