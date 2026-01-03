# Task before ship project to production

## Progress Tracking
Last updated: 2026-01-03

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
- [ ] Create Need Help page with FAQ
- [ ] Add button on login page
- [ ] Add link in app sidebar
- [ ] Contact form or support widget

#### 6. Followers Page Fix
**Status:** ⏳ Not started | **Priority:** MEDIUM
- [ ] Implement comment count per author
- [ ] Group by Facebook/Instagram authors
- [ ] Display follower statistics
- [ ] Add filtering and sorting

#### 7. Delete Account Feature
**Status:** ⏳ Not started | **Priority:** MEDIUM (GDPR compliance)
- [ ] Create delete account modal/popup
- [ ] Add to app sidebar bottom
- [ ] Implement account deletion logic
- [ ] Data cleanup (cascade delete)
- [ ] Confirmation flow

#### 8. Pages Layout Adjustments
**Status:** ⏳ Not started | **Priority:** LOW
- [ ] Single title in header (like Instagram)
- [ ] Main action button in header (right side)
- [ ] Responsive: Hide button text on mobile
- [ ] Apply to all dashboard pages

#### 9. Docker Architecture
**Status:** ⏳ Not started | **Priority:** HIGH
- [ ] Move from Cloudflare deployment to Docker
- [ ] Create optimized Dockerfile
- [ ] Docker Compose configuration
- [ ] Environment variables setup
- [ ] Database migration strategy
- [ ] CI/CD pipeline

#### 10. Security & Production Readiness
**Status:** ⏳ Not started | **Priority:** HIGH
- [ ] Security headers (CORS, CSP, X-Frame-Options)
- [ ] Rate limiting on API endpoints
- [ ] CSRF protection
- [ ] Error handling improvements
- [ ] 404/500 pages enhancement
- [ ] Loading states consistency

#### 11. Analytics & Monitoring
**Status:** ⏳ Waiting for credentials | **Priority:** HIGH
- [ ] Google Analytics integration (waiting for tag)
- [ ] Sentry error monitoring (waiting for DSN)
- [ ] Health check endpoint
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
- Analytics tags will be provided by Bruce
- Sentry DSN will be provided by Bruce
- Project reference: `/Users/bruce/Documents/project/tcf/tcf-web-app`
