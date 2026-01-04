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
**Status:** ⏳ Not started | **Priority:** MEDIUM (GDPR compliance)
- [ ] Create account page
- [ ] User can update their email (after validation code send by mail)
- [ ] Create delete account modal/popup
- [ ] Implement account deletion logic
- [ ] Implement email notification preferences in page
- [ ] Data cleanup (cascade delete)
- [ ] Confirmation flow

#### 8. Pages Layout Adjustments
**Status:** ✅ Completed | **Priority:** LOW
- [x] Single title in header (like Instagram)
- [x] Main action button in header (right side)
- [x] Responsive: Hide button text on mobile
- [x] Apply to all dashboard pages

#### 9. Docker Architecture
**Status:** ⏳ Not started | **Priority:** HIGH
- [ ] Move from Cloudflare deployment to Docker
- [ ] Create optimized Dockerfile
- [ ] Docker Compose configuration
- [ ] Environment variables setup
- [ ] Database migration strategy
- [ ] CI/CD pipeline

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
- [ ] Email notifications (waiting for email service setup)
  - Welcome email
  - Password reset
  - Payment confirmation
  - Moderation alerts
  - Usage limit alerts

### 📝 Notes
- Email service deferred: Domain on Cloudflare, no email provider configured yet
- ✅ Google Analytics (G-ZEJZ4EPXE9) - Integrated with full e-commerce tracking
- Sentry DSN will be provided by Bruce
- Project reference: `/Users/bruce/Documents/project/tcf/tcf-web-app`

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
