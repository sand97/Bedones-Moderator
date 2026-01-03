import type { PrismaConfig } from 'prisma';
import 'dotenv/config';

const config: PrismaConfig = {
  schema: 'prisma/schema.prisma',
};

export default config;
