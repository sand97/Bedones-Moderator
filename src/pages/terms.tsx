import { useTranslation } from 'react-i18next';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import SEO from '~/components/SEO';
import type { NextPageWithLayout } from './_app';

const TermsPage: NextPageWithLayout = () => {
  const { t, i18n } = useTranslation();
  const updatedAt = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'long',
  }).format(new Date());

  return (
    <>
      <SEO
        title={t('legalDocuments.terms.metaTitle', 'Conditions Générales d\'Utilisation')}
        description={t('legalDocuments.terms.metaDescription', 'Consultez les conditions générales d\'utilisation de Moderateur Bedones, plateforme de modération automatique pour Facebook et Instagram.')}
      />
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <main className="container mx-auto px-4 pb-12 max-w-4xl relative z-10">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3">
                {t('legalDocuments.terms.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('legalArticle.updatedLabel')} {updatedAt}
              </p>
            </header>

            <div className="text-gray-700 leading-relaxed">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="mb-4">
                  These Terms of Service ("Terms") govern your use of Bedones
                  Moderator (the "Service"), an AI-powered automated comment
                  moderation platform for Facebook pages.
                </p>
                <p className="mb-4">
                  By accessing and using the Service, you accept and agree to
                  be bound by these Terms. If you do not agree to these Terms,
                  you must not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Service Description
                </h2>
                <p className="mb-4">Bedones Moderator provides:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Automated filtering of undesirable comments on your
                    Facebook pages
                  </li>
                  <li>Detection and management of spam and inappropriate content</li>
                  <li>
                    AI-generated intelligent responses to frequently asked
                    questions
                  </li>
                  <li>
                    Comment hiding or deletion based on your configured settings
                  </li>
                </ul>
                <p className="mb-4">
                  The Service uses artificial intelligence technologies to
                  analyze and process comments automatically.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. Eligibility and Access
                </h2>
                <p className="mb-4">To use the Service, you must:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Have a valid Facebook account with administrator rights to
                    the pages you wish to moderate
                  </li>
                  <li>
                    Be legally capable of entering into binding contracts or
                    have parental consent if required
                  </li>
                  <li>
                    Comply with Facebook's Terms of Service and API usage
                    policies
                  </li>
                  <li>
                    Provide accurate and current information during registration
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. User Obligations
                </h2>
                <p className="mb-4">By using the Service, you agree to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Use the Service in compliance with all applicable laws and
                    regulations
                  </li>
                  <li>
                    Not attempt to circumvent any security measures of the
                    Service
                  </li>
                  <li>
                    Not use the Service for illegal, fraudulent, or malicious
                    purposes
                  </li>
                  <li>Maintain the confidentiality of your login credentials</li>
                  <li>
                    Respect the intellectual property rights of Bedones and
                    third parties
                  </li>
                  <li>
                    Regularly supervise the automated moderation actions
                    performed by the Service
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Responsibilities and Limitations
                </h2>
                <p className="mb-4">
                  <strong>5.1 Service Responsibility</strong>
                </p>
                <p className="mb-4">
                  The Service uses artificial intelligence to analyze comments.
                  While we strive to provide accurate and reliable service, we
                  cannot guarantee:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>100% detection of undesirable content</li>
                  <li>The absence of false positives in moderation</li>
                  <li>Uninterrupted availability of the Service</li>
                </ul>
                <p className="mb-4">
                  <strong>5.2 User Responsibility</strong>
                </p>
                <p className="mb-4">You remain solely responsible for:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Final management of your Facebook pages and their content
                  </li>
                  <li>
                    The moderation settings you configure in the Service
                  </li>
                  <li>The consequences of deleting or hiding comments</li>
                  <li>Compliance with Facebook's policies</li>
                </ul>
                <p className="mb-4">
                  <strong>5.3 Limitation of Liability</strong>
                </p>
                <p className="mb-4">
                  To the fullest extent permitted by law, Bedones shall not be
                  liable for any direct or indirect damages resulting from the
                  use of or inability to use the Service, including loss of
                  data, revenue, or reputation.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Intellectual Property
                </h2>
                <p className="mb-4">
                  The Service, its content, features, and design are the
                  exclusive property of Bedones and are protected by
                  international intellectual property laws.
                </p>
                <p className="mb-4">
                  You may not copy, modify, distribute, sell, or lease any part
                  of the Service without prior written authorization.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Suspension and Termination
                </h2>
                <p className="mb-4">
                  We reserve the right to suspend or terminate your access to
                  the Service at any time, without notice, in case of:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or abusive use of the Service</li>
                  <li>Non-payment of applicable fees (if any)</li>
                  <li>
                    Request from competent authorities or for legal reasons
                  </li>
                </ul>
                <p className="mb-4">
                  You may stop using the Service at any time and revoke access
                  permissions to your Facebook pages through your Facebook
                  account settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Modifications to Service and Terms
                </h2>
                <p className="mb-4">
                  We reserve the right to modify the Service and these Terms at
                  any time. Significant changes will be communicated to you via
                  the Service or by email.
                </p>
                <p className="mb-4">
                  Continued use of the Service after such modifications
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Data Protection
                </h2>
                <p className="mb-4">
                  The processing of your personal data is governed by our{' '}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Privacy Policy
                  </a>
                  , which is an integral part of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Governing Law and Jurisdiction
                </h2>
                <p className="mb-4">
                  These Terms are governed by French law. Any dispute relating
                  to their interpretation or execution shall be subject to the
                  exclusive jurisdiction of French courts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact</h2>
                <p className="mb-4">
                  For any questions regarding these Terms, you can contact us
                  at:
                </p>
                <p className="mb-4">
                  <strong>Bedones Moderator</strong>
                  <br />
                  Email: support@bedones.com
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. General Provisions
                </h2>
                <p className="mb-4">
                  If any provision of these Terms is deemed invalid or
                  unenforceable, the remaining provisions shall remain in full
                  force and effect.
                </p>
                <p className="mb-4">
                  Failure to exercise a right provided by these Terms does not
                  constitute a waiver of that right.
                </p>
              </section>
            </div>
          </article>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
