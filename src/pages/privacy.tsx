import Head from 'next/head';
import { Header } from '~/components/Header';
import { Card, CardContent } from '~/components/ui/card';
import type { NextPageWithLayout } from './_app';

const PrivacyPage: NextPageWithLayout = () => {

  return (
    <>
      <Head>
        <title>Privacy Policy - Bedones Moderator</title>
      </Head>
      <div className="min-h-screen bg-[#FDFDFD] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:80px_80px] relative overflow-hidden">
        <Header className="pt-4 pb-8" />
        <div className="container mx-auto px-4 pb-12 max-w-4xl relative z-10">
          <Card>
            <CardContent className="p-8 prose prose-sm max-w-none">
              <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
              <p className="text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString('en-US')}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Bedones Moderator ("we", "our", or "us") is committed to
                  protecting your privacy. This Privacy Policy explains how we
                  collect, use, disclose, and safeguard your information when
                  you use our AI-powered Facebook comment moderation service
                  (the "Service").
                </p>
                <p className="mb-4">
                  Please read this Privacy Policy carefully. By using the
                  Service, you agree to the collection and use of information
                  in accordance with this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  2. Information We Collect
                </h2>
                <p className="mb-4">
                  <strong>2.1 Information from Facebook</strong>
                </p>
                <p className="mb-4">
                  When you connect your Facebook account to our Service, we
                  collect:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Your Facebook user ID and profile information</li>
                  <li>
                    Information about Facebook pages you manage (page names,
                    IDs, access tokens)
                  </li>
                  <li>
                    Comments posted on your Facebook pages (author name,
                    comment text, timestamp, comment ID)
                  </li>
                  <li>Page engagement metrics and statistics</li>
                </ul>
                <p className="mb-4">
                  <strong>2.2 Usage Information</strong>
                </p>
                <p className="mb-4">We automatically collect:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Moderation settings and preferences you configure in the
                    Service
                  </li>
                  <li>FAQ rules and automated response templates you create</li>
                  <li>
                    Actions taken by the Service (comments hidden, deleted, or
                    replied to)
                  </li>
                  <li>
                    Log data including IP address, browser type, access times,
                    and pages viewed
                  </li>
                </ul>
                <p className="mb-4">
                  <strong>2.3 Local Storage</strong>
                </p>
                <p className="mb-4">
                  We use browser local storage to temporarily save your
                  moderation settings during the OAuth authentication flow to
                  restore them after you return from Facebook.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="mb-4">We use the collected information to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Provide and maintain the comment moderation service
                  </li>
                  <li>
                    Analyze comments using AI to detect spam, undesirable
                    content, and frequently asked questions
                  </li>
                  <li>
                    Automatically hide, delete, or respond to comments based on
                    your configured settings
                  </li>
                  <li>
                    Display moderation history and analytics in your dashboard
                  </li>
                  <li>Improve and optimize our Service and AI models</li>
                  <li>
                    Communicate with you about the Service, including updates
                    and support
                  </li>
                  <li>
                    Detect, prevent, and address technical issues or fraudulent
                    activity
                  </li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  4. AI Processing and Data Analysis
                </h2>
                <p className="mb-4">
                  Our Service uses artificial intelligence (including
                  third-party AI providers such as Anthropic, Google Gemini,
                  and OpenAI) to:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Analyze comment content to detect spam, inappropriate
                    language, and policy violations
                  </li>
                  <li>Match comments against your FAQ rules</li>
                  <li>Generate intelligent responses to user questions</li>
                </ul>
                <p className="mb-4">
                  Comment data may be processed by these third-party AI
                  services in accordance with their respective privacy policies
                  and terms of service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  5. Data Sharing and Disclosure
                </h2>
                <p className="mb-4">We may share your information with:</p>
                <p className="mb-4">
                  <strong>5.1 Third-Party Service Providers</strong>
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    AI service providers (Anthropic, Google, OpenAI) for
                    content analysis
                  </li>
                  <li>Cloud hosting providers for data storage and processing</li>
                  <li>Analytics providers to understand Service usage</li>
                </ul>
                <p className="mb-4">
                  <strong>5.2 Legal Requirements</strong>
                </p>
                <p className="mb-4">
                  We may disclose your information if required by law or in
                  response to valid requests by public authorities (e.g., a
                  court or government agency).
                </p>
                <p className="mb-4">
                  <strong>5.3 Business Transfers</strong>
                </p>
                <p className="mb-4">
                  If we are involved in a merger, acquisition, or asset sale,
                  your information may be transferred. We will provide notice
                  before your information is transferred and becomes subject to
                  a different privacy policy.
                </p>
                <p className="mb-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                <p className="mb-4">
                  We implement appropriate technical and organizational security
                  measures to protect your information, including:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Encryption of data in transit using HTTPS/TLS</li>
                  <li>Secure storage of access tokens and credentials</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                </ul>
                <p className="mb-4">
                  However, no method of transmission over the Internet or
                  electronic storage is 100% secure. While we strive to use
                  commercially acceptable means to protect your information, we
                  cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  7. Data Retention
                </h2>
                <p className="mb-4">
                  We retain your information for as long as necessary to provide
                  the Service and fulfill the purposes outlined in this Privacy
                  Policy. Specifically:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Account information: Until you disconnect your Facebook
                    account or request deletion
                  </li>
                  <li>
                    Comment data and moderation history: Retained for analytics
                    and service improvement
                  </li>
                  <li>
                    Log data: Typically retained for 90 days for security and
                    troubleshooting purposes
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  8. Your Rights and Choices
                </h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    Access, update, or delete your information stored in our
                    Service
                  </li>
                  <li>
                    Revoke Facebook permissions at any time through your
                    Facebook settings
                  </li>
                  <li>
                    Request a copy of your data or export your moderation
                    history
                  </li>
                  <li>
                    Object to processing of your data for certain purposes
                  </li>
                  <li>Lodge a complaint with a data protection authority</li>
                </ul>
                <p className="mb-4">
                  To exercise these rights, please contact us at
                  support@bedones.com.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  9. Third-Party Links
                </h2>
                <p className="mb-4">
                  Our Service may contain links to third-party websites
                  (including Facebook). We are not responsible for the privacy
                  practices of these external sites. We encourage you to review
                  their privacy policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  10. Children's Privacy
                </h2>
                <p className="mb-4">
                  Our Service is not intended for use by individuals under the
                  age of 13. We do not knowingly collect personal information
                  from children under 13. If you become aware that a child has
                  provided us with personal information, please contact us.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  11. International Data Transfers
                </h2>
                <p className="mb-4">
                  Your information may be transferred to and processed in
                  countries other than your country of residence. These
                  countries may have data protection laws that are different
                  from your country's laws.
                </p>
                <p className="mb-4">
                  We take appropriate safeguards to ensure that your information
                  remains protected in accordance with this Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  12. Changes to This Privacy Policy
                </h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the "Last updated" date.
                </p>
                <p className="mb-4">
                  You are advised to review this Privacy Policy periodically for
                  any changes. Changes are effective when posted on this page.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. GDPR Compliance</h2>
                <p className="mb-4">
                  If you are in the European Economic Area (EEA), you have
                  certain data protection rights under the General Data
                  Protection Regulation (GDPR):
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Right to access your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                </ul>
                <p className="mb-4">
                  Our legal basis for processing your data is your consent when
                  you authorize access to your Facebook account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please
                  contact us:
                </p>
                <p className="mb-4">
                  <strong>Bedones Moderator</strong>
                  <br />
                  Email: support@bedones.com
                  <br />
                  For GDPR-related inquiries: privacy@bedones.com
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;
