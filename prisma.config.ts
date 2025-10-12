import type { PrismaConfig } from 'prisma';
import { PrismaD1 } from '@prisma/adapter-d1';
import 'dotenv/config';

// Only use D1 adapter in production (Cloudflare)
// For local development, use standard SQLite via DATABASE_URL
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.USE_D1_ADAPTER === 'true';

const config: PrismaConfig = {
  schema: 'prisma/schema.prisma',
};

// Only add adapter in production
if (isProduction) {
  config.experimental = {
    adapter: true,
  };
  config.adapter = async () => {
    return new PrismaD1({
      CLOUDFLARE_D1_TOKEN: process.env.CLOUDFLARE_D1_TOKEN!,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
      CLOUDFLARE_DATABASE_ID: process.env.CLOUDFLARE_DATABASE_ID!,
    });
  };
}

export default config;
