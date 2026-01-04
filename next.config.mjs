import { withSentryConfig } from '@sentry/nextjs';
// @ts-check

/**
 * @type {import('next').NextConfig}
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default withSentryConfig(
  {
    /**
     * Dynamic configuration available for the browser and server.
     * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
     * @see https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
     */
    publicRuntimeConfig: {
      NODE_ENV: process.env.NODE_ENV,
    },

    /** We run eslint as a separate task in CI */
    eslint: {
      ignoreDuringBuilds: true,
    },

    /** We run typechecking as a separate task in CI */
    typescript: {
      ignoreBuildErrors: true,
    },

    /** Standalone output for Docker deployment */
    output: 'standalone',

    /** Allow cross-origin requests for development */
    allowedDevOrigins: ['moderator.bedones.local', 'moderator.bedones.com'],

    /** i18n configuration */
    i18n: {
      locales: ['fr', 'en'],
      defaultLocale: 'fr',
    },
  },
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: 'biyemassi',

    project: 'moderator-bedones',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    webpack: {
      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,

      // Tree-shaking options for reducing bundle size
      treeshake: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        removeDebugLogging: true,
      },
    },
  },
);
