import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FacebookConnectButton } from '~/components/FacebookConnectButton';
import { InstagramConnectButton } from '~/components/InstagramConnectButton';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import {
  IntelligentFAQSection,
  type FAQItem,
} from '~/components/IntelligentFAQSection';
import { SpamDetectionSection } from '~/components/SpamDetectionSection';
import { Card, CardContent } from '~/components/ui/card';
import { UndesiredCommentsSection } from '~/components/UndesiredCommentsSection';
import { useSession } from '~/lib/auth-client';
import type { NextPageWithLayout } from './_app';
import Link from 'next/link';

const IndexPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [undesiredCommentsEnabled, setUndesiredCommentsEnabled] =
    useState(true);
  const [undesiredCommentsAction, setUndesiredCommentsAction] = useState<
    'delete' | 'hide'
  >('hide');
  const [spamDetectionEnabled, setSpamDetectionEnabled] = useState(true);
  const [spamAction, setSpamAction] = useState<'delete' | 'hide'>('delete');
  const [intelligentFAQEnabled, setIntelligentFAQEnabled] = useState(false);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (!isPending && session?.user) {
      router.push('/dashboard');
    }
  }, [session, isPending, router]);

  // Show nothing while checking session or redirecting
  if (isPending || session?.user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Bedones Moderator</title>
      </Head>
      <div className="min-h-[90vh] app-grid-bg relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 pb-4 max-w-2xl relative z-10">
          <div className="text-center mb-6">
            <h1 className="lg:text-4xl text-2xl font-light text-black mb-2">
              {t('page.title')}
            </h1>
            <p className="text-gray-500 font-normal">{t('page.subtitle')}</p>
          </div>

          <div className="mb-8 space-y-2">
            <Card>
              <CardContent className="p-6">
                <UndesiredCommentsSection
                  enabled={undesiredCommentsEnabled}
                  onEnabledChange={setUndesiredCommentsEnabled}
                  action={undesiredCommentsAction}
                  onActionChange={setUndesiredCommentsAction}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <SpamDetectionSection
                  enabled={spamDetectionEnabled}
                  onEnabledChange={setSpamDetectionEnabled}
                  action={spamAction}
                  onActionChange={setSpamAction}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <IntelligentFAQSection
                  enabled={intelligentFAQEnabled}
                  onEnabledChange={setIntelligentFAQEnabled}
                  faqItems={faqItems}
                  onFaqItemsChange={setFaqItems}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <div className="max-w-full w-80 flex flex-col gap-2">
              <FacebookConnectButton
                undesiredCommentsEnabled={undesiredCommentsEnabled}
                undesiredCommentsAction={undesiredCommentsAction}
                spamDetectionEnabled={spamDetectionEnabled}
                spamAction={spamAction}
                intelligentFAQEnabled={intelligentFAQEnabled}
                faqItems={faqItems}
              />
              <InstagramConnectButton
                undesiredCommentsEnabled={undesiredCommentsEnabled}
                undesiredCommentsAction={undesiredCommentsAction}
                spamDetectionEnabled={spamDetectionEnabled}
                spamAction={spamAction}
                intelligentFAQEnabled={intelligentFAQEnabled}
                faqItems={faqItems}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-3">
              <Trans
                i18nKey="instagram.disclaimer"
                components={{
                  terms: (
                    <Link
                      href="/terms"
                      className="underline hover:text-gray-700"
                    />
                  ),
                  privacy: (
                    <Link
                      href="/privacy"
                      className="underline hover:text-gray-700"
                    />
                  ),
                }}
              />
            </p>
          </div>
        </div>
        {/* Background Illustrations */}
        {/* <div className="flex flex-col lg:flex-row justify-around lg:items-end items-center gap-8 lg:pt-16 py-8 px-8 pointer-events-none z-0">
        <MessageIllustration
          message={t('illustration.case1.message')}
          action={t('illustration.case1.action')}
        />
        <MessageIllustration
          message={t('illustration.case2.message')}
          action={t('illustration.case2.action')}
        />
        <MessageIllustration
          message={t('illustration.case3.message')}
          action={t('illustration.case3.action')}
        />
      </div> */}
      </div>
      <Footer />
    </>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @see https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.post.all.fetch();
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
