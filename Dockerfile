# Dockerfile for Moderateur Bedones
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install dependencies for Prisma and su-exec for user switching
RUN apk add --no-cache openssl libc6-compat tini su-exec curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DISABLE_PRISMA_TELEMETRY=true

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Prisma CLI globally (before switching to nextjs user)
RUN npm install --global prisma@6.7.0

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy scripts
COPY --chmod=755 start.sh /usr/local/bin/start.sh
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Create directory for SQLite database (separate from schema)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use entrypoint that will fix permissions then run start script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
