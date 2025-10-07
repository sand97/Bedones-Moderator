# Facebook Comment Moderator

A powerful Next.js application for monitoring and moderating Facebook page comments in real-time. Built with tRPC, Prisma, and designed for deployment on Cloudflare Pages with D1 database.

## 🚀 Features

- **Real-time Comment Monitoring**: Monitor all comments on your Facebook page in real-time
- **Smart Filtering**: Automatically filter spam and inappropriate content using AI
- **Easy Management**: Bulk actions, custom rules, and intuitive dashboard
- **Cloudflare Deployment**: Optimized for Cloudflare Pages with D1 database
- **Static Generation**: Home page uses static generation for optimal performance

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (Pages Router)
- **Database**: Cloudflare D1 (SQLite) with Prisma ORM
- **API**: tRPC for type-safe APIs
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Testing**: Vitest + Playwright

## 📋 Prerequisites

- Node.js 20.14.0 or higher
- npm or pnpm
- Cloudflare account with D1 database access
- Facebook Developer Account

## 🔧 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Fill in your `.env` file:

```env
# Local development with SQLite
DATABASE_URL="file:./dev.db"

# Facebook App Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
```

### 3. Database Setup

For local development:

```bash
# Run initial migration
npx prisma migrate dev --name init

# Seed the database (optional)
npm run db-seed

# Open Prisma Studio to view data
npm run prisma-studio
```

### 4. Development Server

#### Standard Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

#### Local HTTPS Development (for Facebook Login Testing)

Facebook OAuth requires HTTPS for callbacks. To test locally with HTTPS:

1. **Add the domain to your hosts file** (already done if you followed setup):

```bash
# /etc/hosts should contain:
# 127.0.0.1 moderator.bedones.local
```

2. **Update your `.env` file**:

```env
NEXTAUTH_URL=https://moderator.bedones.local
```

3. **Start the Next.js development server**:

```bash
npm run dev
```

4. **Start Caddy in a separate terminal** (from project root):

```bash
caddy run
```

5. **Access the application**:

Open [https://moderator.bedones.local](https://moderator.bedones.local)

Your browser will show a security warning about the self-signed certificate. Click "Advanced" and proceed to accept the certificate.

6. **Configure Facebook App**:

In your Facebook Developer Console, set the OAuth redirect URL to:
```
https://moderator.bedones.local/api/auth/callback/facebook
```

**Note**: Keep both terminals running - one for Next.js (`npm run dev`) and one for Caddy (`caddy run`).

## 🌐 Cloudflare Deployment

### 1. Database Configuration

Your D1 database is already configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "moderateur_bedones_db"
database_name = "moderateur-bedones-db"
database_id = "0d7ab73c-d8d6-443d-b3ac-cc3a7adb1028"
```

### 2. Database Migrations

#### Initial Setup (First Time Only)

When deploying for the first time, apply the initial schema to your remote D1 database:

```bash
# Generate SQL migration from Prisma schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script > init.sql

# Apply to remote D1 database
npx wrangler d1 execute moderateur-bedones-db --remote --file=init.sql

# Clean up
rm init.sql
```

#### Schema Updates (After Changing prisma/schema.prisma)

When you update your Prisma schema, follow these steps:

**1. Update local development database:**
```bash
npx prisma migrate dev --name description_of_change
```

**2. Generate and apply migration to production:**
```bash
# Generate migration SQL from the schema change
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script > migration.sql

# Apply to remote D1 database
npx wrangler d1 execute moderateur-bedones-db --remote --file=migration.sql

# Clean up
rm migration.sql
```

**Note:** D1 doesn't track Prisma migrations like traditional databases. Always verify your schema changes before applying to production.

### 3. Deploy to Cloudflare Pages

**Quick Deploy (Build + Deploy):**
```bash
npm run build-deploy-cf
```

**Or step by step:**
```bash
# Build for production with Cloudflare adapter
npm run build:cf

# Deploy to Cloudflare Pages
npx wrangler pages deploy .vercel/output/static
```

### 4. Preview Locally with D1

```bash
# Preview with Cloudflare D1 binding
npm run preview
```

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run generate` - Generate Prisma client
- `npm run prisma-studio` - Open Prisma Studio
- `npm run db-seed` - Seed database

### Database Migrations
- `npm run migrate-dev` - Run migrations on local database
- `npm run migrate` - Deploy migrations (for CI/CD)

### Testing & Quality
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run test-unit` - Run unit tests
- `npm run test-e2e` - Run E2E tests

### Build & Deploy
- `npm run build` - Build Next.js for production
- `npm run build:cf` - Build with Cloudflare adapter
- `npm run build-deploy-cf` - Build and deploy to Cloudflare Pages
- `npm run preview` - Preview with Cloudflare Workers locally
- `npm run start` - Start production server (Node.js)

## 🏗️ Project Structure

```
├── src/
│   ├── pages/              # Next.js pages (Pages Router)
│   │   ├── api/trpc/       # tRPC API routes
│   │   ├── index.tsx       # Home page (static)
│   │   └── dashboard.tsx   # Dashboard page
│   ├── server/             # Server-side code
│   │   ├── routers/        # tRPC routers
│   │   ├── prisma.ts       # Prisma client setup
│   │   ├── context.ts      # tRPC context
│   │   └── trpc.ts         # tRPC setup
│   └── utils/              # Utility functions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── wrangler.toml          # Cloudflare configuration
└── next.config.ts         # Next.js configuration
```

## 🔌 Facebook Integration

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add the Webhooks product
4. Configure webhook URL: `https://monitoring.bedones.com/api/webhook`

### 2. Configure Permissions

In your Facebook App settings, add these permissions:
- `pages_show_list` - List pages user manages
- `pages_read_user_content` - Read page content
- `pages_manage_engagement` - Manage comments, reactions
- `pages_read_engagement` - Read comments, reactions
- `pages_manage_posts` - Create, edit, delete posts and comments
- `pages_messaging` - Send and receive messages

### 3. OAuth Redirect URL

Set the OAuth redirect URL in your Facebook App:
- **Local Development**: `https://moderator.bedones.local/api/auth/callback/facebook`
- **Production**: `https://your-domain.com/api/auth/callback/facebook`

### 4. Webhook Configuration

Configure webhooks to receive:
- `feed` (new posts)
- `comments` (new comments)
- `mention` (page mentions)

Webhook URL: `https://your-domain.com/api/webhooks/facebook`

## 🛡️ Security Considerations

- All Facebook API credentials are stored as environment variables
- Database access is restricted through Cloudflare D1 bindings
- tRPC provides type-safe API endpoints
- Input validation using Zod schemas

## 📊 Monitoring

The application will be accessible at:
- **Production**: `https://monitoring.bedones.com`
- **Development**: `http://localhost:3000`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is private and confidential.

## 🆘 Support

For support and questions, please contact the development team.
