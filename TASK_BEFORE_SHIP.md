# Task before ship project to production

## Progress Tracking
Last updated: 2026-01-04

### ✅ Already Implemented
- [x] Basic authentication system (Better Auth)
- [x] Facebook & Instagram integration
- [x] Comment moderation (AI-powered)
- [x] Database schema with Prisma (including Payment & Subscription models)
- [x] Privacy & Terms pages
- [x] Basic dashboard structure
- [x] **Email System (Resend)** - Complete transactional & marketing email infrastructure
  - [x] Resend integration with batch API
  - [x] Black/White minimalist email templates
  - [x] Welcome email (after email verification)
  - [x] Email verification (for social auth users)
  - [x] Payment confirmation emails (success/failed)
  - [x] Subscription expiration alerts (7 days + expired)
  - [x] Low credits warning emails
  - [x] Blog-to-email system (with scheduled sends)
  - [x] Email tracking (opens, clicks via Resend webhooks)
  - [x] Unsubscribe system
  - [x] User preference management (emailSubscribed field)

### 🚧 In Progress

#### 1. SEO Implementation
**Status:** ⏳ Not started | **Priority:** HIGH (Critical for launch)
- [ ] Sitemap XML generation
- [ ] Meta tags (Open Graph, Twitter Cards)
- [ ] Structured Data (JSON-LD Schema.org)
- [ ] Favicon and logos
- [ ] robots.txt
- [ ] Hreflang for i18n

#### 2. Blog Section
**Status:** ⏳ Not started | **Priority:** HIGH
- [ ] Create blog content directory structure
- [ ] Implement markdown parser for blog articles
- [ ] Create blog listing page
- [ ] Create individual blog article pages
- [ ] Add blog link to homepage footer
- [ ] Write initial blog articles in French

#### 3. Payment Implementation
**Status:** ⏳ Not started | **Priority:** HIGH
- [ ] Stripe integration (checkout, webhook)
- [ ] NotchPay integration (Mobile Money)
- [ ] Payment status page
- [ ] Subscription management pages
- [ ] Payment history display

#### 4. Usage Tracking & Display
**Status:** ⏳ Backend ready, Frontend pending | **Priority:** MEDIUM
- [x] Database schema (UsageTracking model)
- [ ] Backend API to track and aggregate usage
- [ ] Frontend: Display tokens left
- [ ] Frontend: Daily usage graph (by platform)
- [ ] Frontend: Monthly spending graph
- [ ] Frontend: Yearly spending graph
- [ ] Add money button (redirect to Payment)

#### 5. Need Help Page
**Status:** ⏳ Not started | **Priority:** MEDIUM
- [x] Create Need Help page with FAQ
- [x] Add button on login page
- [x] Add link in app sidebar
- [x] Contact form or support widget

#### 6. Followers Page Fix
**Status:** ⏳ Not started | **Priority:** MEDIUM
- [x] Implement comment count per author
- [x] Group by Facebook/Instagram authors
- [x] Display follower statistics
- [x] Add filtering and sorting

#### 7. Implement Account Features
**Status:** ✅ Completed | **Priority:** MEDIUM (GDPR compliance)
- [x] Create account page (/dashboard/account)
- [x] User can update their email (with verification code sent by email)
- [x] Resend verification email button when email not verified
- [x] Create delete account modal/popup (with DELETE confirmation)
- [x] Implement account deletion logic (API: /api/user/delete-account)
- [x] Implement email notification preferences (marketing + transactional emails)
- [x] Data cleanup (cascade delete all user data)
- [x] Confirmation flow (type DELETE to confirm)
- [x] Added emailTransactional field to User model (Prisma migration applied)

#### 8. Pages Layout Adjustments
**Status:** ✅ Completed | **Priority:** LOW
- [x] Single title in header (like Instagram)
- [x] Main action button in header (right side)
- [x] Responsive: Hide button text on mobile
- [x] Apply to all dashboard pages


#### 10. Security & Production Readiness
**Status:** ✅ Completed | **Priority:** HIGH
- [x] Security headers (CORS, CSP, X-Frame-Options)
- [x] Rate limiting on API endpoints
- [x] CSRF protection
- [x] Error handling improvements
- [x] 404/500 pages enhancement
- [x] Loading states consistency

#### 11. Analytics & Monitoring
**Status:** ✅ Google Analytics Done, Sentry Pending | **Priority:** HIGH
- [x] Google Analytics integration (tag: G-ZEJZ4EPXE9)
  - [x] Core integration with `@next/third-parties/google`
  - [x] User identification tracking (auto login/logout)
  - [x] E-commerce tracking (begin_checkout, purchase)
  - [x] Custom event tracking utilities
  - [x] Page view tracking
- [ ] Sentry error monitoring (waiting for DSN)
- [x] Health check endpoint
- [ ] Uptime monitoring setup

### 📋 Deferred for Later
- [ ] Password reset email (not yet implemented, but infrastructure ready)
- [ ] Moderation alerts (not yet implemented, but infrastructure ready)

### 📝 Notes
- ✅ Email System (Resend) - Complete infrastructure with batch sending, tracking, and blog integration
- ✅ Google Analytics (G-ZEJZ4EPXE9) - Integrated with full e-commerce tracking
- Sentry DSN will be provided by Bruce
- Project reference: `/Users/bruce/Documents/project/tcf/tcf-web-app`

### 🎯 Email System Implementation Details
**Provider:** Resend (API-based, modern email service)

**Files Created:**
- `src/lib/email/mailer.ts` - Resend integration with sendEmail() and sendBatchEmails()
- `src/lib/email/templates.ts` - 7 Black/White minimalist email templates
- `src/lib/email/blog-to-email.ts` - Markdown to HTML email converter
- `src/pages/api/email/track/open.ts` - Email open tracking (1x1 pixel)
- `src/pages/api/email/track/click.ts` - Email click tracking + redirect
- `src/pages/api/email/unsubscribe.ts` - Unsubscribe handler
- `src/pages/api/webhooks/resend.ts` - Resend webhook for delivery/open/click/bounce events
- `src/pages/api/user/add-email.ts` - Add email to social auth account
- `src/pages/api/user/verify-email.ts` - Email verification handler
- `src/pages/api/cron/send-blog-emails.ts` - Daily cron for blog email campaigns

**Database Models:**
- `EmailCampaign` - Campaign tracking with statistics
- `EmailLog` - Individual email tracking (PENDING → SENT → DELIVERED → OPENED → CLICKED)
- `EmailClick` - Click tracking records
- Added `emailSubscribed` field to User model

**Email Templates (Black/White Minimalist):**
1. Payment Success - Receipt with credits added
2. Payment Failed - Retry CTA with reason
3. Subscription Expired - Feedback request + renewal CTA
4. Subscription Expiring (7 days) - Renewal reminder
5. Low Credits Warning - Usage alert + upgrade CTA
6. Email Verification - 24h token verification
7. Welcome Email - Onboarding after verification

**Key Features:**
- **Batch sending** via `resend.batch.send()` (up to 100 emails/call)
- **Individual tracking** per recipient (unique tracking ID, unsubscribe link)
- **Blog-to-email** with frontmatter scheduling (`sendEmailAt: "2026-01-10"`)
- **Resend webhooks** for real-time delivery/open/click tracking
- **Transactional emails** integrated in payment callback and cron jobs
- **Privacy compliant** with unsubscribe and emailSubscribed preferences

**TODOs Implemented:**
- ✅ src/pages/api/notchpay/callback.ts:110 - Payment success email
- ✅ src/pages/api/notchpay/callback.ts:124 - Payment failed email
- ✅ src/lib/cron-utils.ts:151 - Subscription expired email
- ✅ src/lib/cron-utils.ts:221 - Expiring soon reminder
- ✅ src/lib/cron-utils.ts:230 - Low credits warning

**Setup Required:**
1. Add `RESEND_API_KEY` to production .env
2. Configure Resend webhook: `https://moderator.bedones.local/api/webhooks/resend`
3. Set up cron job for `/api/cron/send-blog-emails` (daily at 10:00 AM)
4. Verify sender domain in Resend dashboard

### 🎯 Google Analytics Implementation Details
**Files Created:**
- `src/lib/analytics.ts` - GA utility functions (identifyUser, clearUser, trackBeginCheckout, trackPurchase, trackEvent, trackPageView)
- `src/components/AnalyticsIdentifier.tsx` - Auto user identification on login/logout
- `src/components/PurchaseTracker.tsx` - Auto purchase tracking on payment success

**Files Modified:**
- `src/pages/_app.tsx` - Integrated GA components
- `src/pages/dashboard/payment-method.tsx` - Added begin_checkout tracking

**Tracking Coverage:**
- User sessions (with user_id on login)
- Page views (automatic)
- E-commerce funnel (begin_checkout → purchase)
- Custom events (via trackEvent utility)
- Payment provider attribution (Stripe vs NotchPay)
