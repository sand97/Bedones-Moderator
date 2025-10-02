import type { NextPageWithLayout } from './_app';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Header } from '~/components/Header';
import { UndesiredCommentsSection } from '~/components/UndesiredCommentsSection';
import { SpamDetectionSection } from '~/components/SpamDetectionSection';
import {
  IntelligentFAQSection,
  type FAQItem,
} from '~/components/IntelligentFAQSection';
import { FacebookConnectButton } from '~/components/FacebookConnectButton';
import { MessageIllustration } from '~/components/MessageIllustration';

const IndexPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [undesiredCommentsEnabled, setUndesiredCommentsEnabled] =
    useState(true);
  const [undesiredCommentsAction, setUndesiredCommentsAction] = useState<
    'delete' | 'hide'
  >('hide');
  const [spamDetectionEnabled, setSpamDetectionEnabled] = useState(true);
  const [spamAction, setSpamAction] = useState<'delete' | 'hide'>('delete');
  const [intelligentFAQEnabled, setIntelligentFAQEnabled] = useState(false);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
      <Header className="pt-4 pb-8" />
      <div className="container mx-auto px-4 pb-4 max-w-2xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="lg:text-4xl text-2xl font-light text-black mb-2">
            {t('page.title')}
          </h1>
          <p className="text-gray-500 font-normal">{t('page.subtitle')}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 space-y-6">
            <UndesiredCommentsSection
              enabled={undesiredCommentsEnabled}
              onEnabledChange={setUndesiredCommentsEnabled}
              action={undesiredCommentsAction}
              onActionChange={setUndesiredCommentsAction}
            />

            <Separator />

            <SpamDetectionSection
              enabled={spamDetectionEnabled}
              onEnabledChange={setSpamDetectionEnabled}
              action={spamAction}
              onActionChange={setSpamAction}
            />

            <Separator />

            <IntelligentFAQSection
              enabled={intelligentFAQEnabled}
              onEnabledChange={setIntelligentFAQEnabled}
              faqItems={faqItems}
              onFaqItemsChange={setFaqItems}
            />
          </CardContent>
        </Card>

        <FacebookConnectButton
          undesiredCommentsEnabled={undesiredCommentsEnabled}
          spamDetectionEnabled={spamDetectionEnabled}
          intelligentFAQEnabled={intelligentFAQEnabled}
        />
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
