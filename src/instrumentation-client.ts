// Client Sentry init lives in sentry.client.config.ts to avoid double setup.
import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
