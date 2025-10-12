// @ts-check

// Setup Cloudflare bindings for local development
if (process.env.NODE_ENV === 'development') {
  const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
  await setupDevPlatform();
}

/**
 * @type {import('next').NextConfig}
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
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
  /** Configuration for Cloudflare Pages deployment */
  images: {
    unoptimized: true,
  },
  /** Allow cross-origin requests for development */
  allowedDevOrigins: ['moderator.bedones.local', 'moderator.bedones.com'],
  /** i18n configuration */
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
  },
};
