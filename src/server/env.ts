/**
 * This file is included in `/next.config.ts` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */

import { z } from 'zod';

const envSchema = z.object({
  // DATABASE_URL is optional in production when using Cloudflare D1
  // The database connection is handled through D1 binding instead
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(_env.error.format(), null, 4),
  );
}
export const env = _env.data;
