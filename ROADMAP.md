# Roadmap (Post‑v1)

The project is feature‑complete for v1.0. This document intentionally removes historical and completed plans to reduce noise and keep focus on what’s next.

Track active work in GitHub issues and milestones. This file is a high‑level guide only.

## Recently Completed

- Internationalization & SEO improvements
  - Locale‑aware currency/date formatting utilities and usage across homepage/shop.
  - Language alternates in metadata and localized sitemap including real category URLs.
  - JSON‑LD structured data on Product (PDP) and Category pages.
  - Minimal language switcher header (env‑gated) on homepage.
- Auth UX alignment
  - Shared root layout for all auth pages with consistent centering and spacing.
  - Removed per‑page shaded wrappers and unified form card width (`max-w-md`).
- Session & Admin labeling
  - Added trusted endpoint `GET /api/me` that returns `user.isAdmin` (role or allowlist).
  - Avatar menu and dashboard header now prefer server `isAdmin` over client envs.
- Dev ergonomics for cookies
  - Local HTTP: when `ENABLE_CROSS_SITE_COOKIES=true` without HTTPS, auth falls back to `sameSite=lax; secure=false` to avoid cookie rejection.
  - `.env.local.example` defaults to `ENABLE_CROSS_SITE_COOKIES=false` for local.
- i18n minimal config
  - App‑level `LOCALES_CONFIG` with expanded languages in the dropdown; only `en/es` enabled by default.
  - Documentation added for minimal, flexible i18n setup.
- Accessibility & Tooling
  - Enabled `eslint-plugin-jsx-a11y` and addressed blocking a11y issues in admin.
- Storage & Media
  - Implemented S3‑backed uploads via `/api/uploads` with local disk fallback for dev.
  - Admin Dashboard uploader now persists real image/video URLs and previews.

- Auth client helpers & login UX
  - Centralized typed Better Auth client helpers in `apps/web/src/lib/auth-client-helpers.ts`; migrated web callsites.
  - Enabled username-or-email login across login/signup/profile flows; aligned server/client validation.
- Forms & accessibility polish
  - Unique field IDs via `useId()` in major forms (shipping, payment, contact, address) and semantic status elements where appropriate.
  - App `Button` shim now defaults `type="button"` to prevent accidental submissions.
- Branding & docs
  - Updated brand copy to “ModularShop” in UI and refreshed app description.
  - Added documentation on auth helpers and a11y/IDs to `docs/architecture.md` and `docs/frontend-architecture.md`.

## Near‑Term

- Internationalization (i18n)
  - Routing & UX
    - Next.js i18n routing (locale subpaths and/or domains) and locale negotiation via `Accept-Language` with cookie persistence.
    - Header locale switcher UI with accessible combobox and language names in native form (endonym).
    - Localized static content (marketing pages), dynamic content (catalog), and emails.
    - Promote `LOCALES_CONFIG` to drive routing and navigation once more locales are enabled.
  - Data Model & CMS
    - Drizzle migrations for translatable fields (product/category name, description, SEO fields), with fallback strategy.
    - Optional integration with a translation workflow (e.g., Contentlayer/Sanity or external TMS); draft/publish lifecycle.
  - Formatting & Currency
    - `Intl.NumberFormat` for currency/number/date formatting based on active locale.
    - Multi‑currency pricing strategy (display only vs. transactional) and exchange‑rate source; per‑currency rounding rules.
  - QA & Tooling
    - Link and sitemap localization, locale‑aware canonical tags.
    - Add i18n E2E coverage for critical flows (browse → checkout → order).

- Roles & Permissions (RBAC)
  - Roles: Admin, Manager, Support, Customer (extensible); route and action guards.
  - Policy checks in API handlers; audit logs for sensitive mutations.
- Payments
  - Payment extensions: Apple Pay / Google Pay (Stripe Payment Request).
  - Adyen; multi‑currency and tax/VAT enhancements.
  - Digital‑first providers (for broader country coverage):
    - Lemonsqueezy — hosted checkout/portal, subscriptions, licensing; webhooks → internal order status mapping.
    - Polar — subscriptions/donations for creators; hosted flows; revenue share compliance.
    - Creem — checkout for digital downloads/memberships; EU VAT handling.
  - Architecture
    - Define provider adapter interface in `@repo/payments` (create/confirm/refund/capture/config). Keep RO‑RO typed DTOs.
    - Add Next.js route handlers per provider under `/api/v1/payments/{provider}/**`; reuse shared idempotency and webhook verification.
    - Feature‑flag providers via server config; surface availability to the UI via `config` endpoints/hooks.
  - Deliverables
    - Demo SKUs/flows for digital goods (download links/license delivery) and physical goods (shipping) for each provider.
    - Test modes, sandbox credentials, and thorough webhook integration tests.
- Performance & Observability
  - CDN + cache headers, image optimization, query caching.
  - Structured logging (Pino), tracing/metrics (OTel), basic error triage dashboard.
- Accessibility & SEO
  - Accessibility (A11y)
    - End‑to‑end keyboard navigation (skip links, focus outlines, visible focus order, focus traps in dialogs/drawers).
    - Landmarks and semantics: `header/main/nav/footer`, tables with proper headers, descriptive buttons/links, form labels and error text.
    - Color contrast audit; prefers‑reduced‑motion considerations; announce async state changes to screen readers.
    - Tooling: `eslint-plugin-jsx-a11y`, Playwright + axe integration in CI, snapshots for critical pages.
  - SEO
    - Route‑level metadata: titles, descriptions, canonical URLs; locale alternates when i18n is enabled.
    - JSON‑LD structured data for `Product`, `BreadcrumbList`, `Organization`, `FAQ` where relevant.
    - XML sitemap(s) (including localized variants) and robots.txt; image sitemaps for product media.
    - Open Graph/Twitter cards for PDP and key marketing pages.

- Storage & Media — Implemented (S3) + Follow‑ups
  - Implemented: S3 uploads in `/api/uploads` with public URLs; local fallback in dev.
  - Implemented: Admin uploader integrates with route and shows persisted previews.
  - Follow‑ups: signed upload URL flow (optional), validation/virus scanning hook, image derivatives via CDN/loader.
  - Follow‑ups: media DB schema (URL, kind, dimensions, bytes, alt) and relations to products/categories.
  - Follow‑ups: quotas/limits and admin audit logs; migration to convert old placeholders.

## Medium‑Term

- Notifications
  - Email (Resend/SMTP) templates + async delivery; in‑app toasts/inbox.
  - Rate limits and user preferences.
- Search & Filters
  - Faceted search; server‑side relevance tuning; index rebuild tasks.
- Content & CMS (Optional)
  - Light CMS for editorial pages (Sanity/Contentlayer) without coupling core commerce.
- Analytics & Attribution
  - Affiliate improvements, UTM attribution, campaign dashboards.
- Testing & CI
  - Playwright E2E on critical journeys; artifacts on failure; coverage gates.
- Security Hardening
  - Security headers, CSRF posture review, password/2FA policies, API rate limits.

## Longer‑Term

- Multi‑tenant support and organization/workspace model.
- Mobile app integration; token strategy and API surface hardening.
- Extensibility: plugin hooks for catalog, pricing, fulfillment.

---

For proposals and RFCs, open a GitHub issue using the “Feature Request” template. Attach design sketches, API proposals, and acceptance tests when possible.

 

---

## Notes on Deprecated Content

Historical plans that referenced a separate Medusa/Bun backend have been removed to avoid confusion. The project is committed to a consolidated architecture:

- Backend mounted inside Next.js via Route Handlers and Hono (`apps/web/src/app/api/*`).
- Database and migrations centralized in `@repo/db` (Drizzle + Postgres).
- Authentication via Better Auth under `/api/auth/[...all]`.

All future planning should build on this unified model. For legacy history, refer to repository history (git).
