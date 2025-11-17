# Changelog

All notable changes to this project will be documented in this file.

## [1.1.7] - 2025-11-16
### Changed
- Upgraded the web app to **Next.js 16.0.3** and **React 19.2.0**.
  - `apps/web/package.json` now targets Next.js 16 and React 19.2, aligning with the latest starter defaults.
- Migrated ESLint in `apps/web` to the native **ESLint 9 flat config** and removed deprecated Next.js lint wiring.
  - Replaced `next lint` with direct `eslint . --ext .ts,.tsx` scripts.
  - Removed the deprecated `eslint` option from `apps/web/next.config.ts`.
  - Ignored `.next` and `scripts` in ESLint config to avoid parsing generated files.
- Tuned **Biome** configuration for Tailwind CSS v4 directives and monorepo usage.
  - Enabled Tailwind v4 directive parsing in the root `biome.json`.
- Updated documentation and marketing copy to reference **Next.js 16** instead of 15.
  - `README.md`, `docs/architecture.md`, `docs/performance-playbook.md`.
  - Marketing hero components under `apps/web/modules/marketing/home/*`.
- Introduced a Next.js 16-style `proxy.ts` auth gate for the web app.
  - `apps/web/proxy.ts` now protects `/dashboard` routes by redirecting unauthenticated users to `/auth/login` with a `callbackUrl`.
  - Existing locale-prefix and affiliate referral cookie logic remains in `apps/web/src/middleware.ts`.

### Fixed
- Resolved prior ESLint issues after the Next.js 16 upgrade.
  - Eliminated circular/legacy config problems by consolidating on a single flat config.
  - Removed unused `eslint-disable` comments and addressed a `react-hooks/exhaustive-deps` warning in the PayPal return page.
- Verified that `pnpm --filter web lint` and `pnpm --filter web typecheck` complete without errors on the upgraded stack.

## [1.1.6] - 2025-10-27
### Added
- Dashboard metadata descriptions for improved SEO on private routes:
  - `apps/web/src/app/dashboard/user/layout.tsx`
  - `apps/web/src/app/dashboard/admin/layout.tsx`
- README “Performance & CLS (Home vs. Shop)” section explaining the homepage CLS spike and stabilizations.

### Changed
- A11y: Progressbars now expose accessible names and proper aria attributes.
  - `apps/web/modules/ui/components/progress.tsx` adds `role="progressbar"`, `aria-valuenow/min/max`, default `aria-label`.
  - `apps/web/src/app/dashboard/user/_components/membership-card.tsx` passes a descriptive label.
- A11y: Breadcrumb list semantics fixed (only `BreadcrumbItem`/`BreadcrumbSeparator` as direct children).
  - `apps/web/src/app/dashboard/user/_components/dashboard-header.tsx`
- A11y: Increased tap target sizes on sidebar rail, trigger, and submenu buttons (≥48px on small screens).
  - `apps/web/modules/ui/components/sidebar.tsx`
- SEO: Allow indexing in development to remove Lighthouse “blocked by robots” warning while keeping production locked down.
  - `apps/web/src/app/robots.ts` now disallows `/dashboard*` only in `NODE_ENV=production`.

### Fixed
- Dev console error: resolved `SyntaxError: Unexpected string` from inline overlay script.
  - `apps/web/src/app/layout.tsx` corrected string escaping in the dev-only crash overlay script.
- Minor a11y warnings for icon-only buttons in dashboard (labels and reserved space in components already covered by earlier work).

### CLS notes
- The shop page consistently scores 100 with CLS ≈ 0.006 due to fully static above‑the‑fold content and stable image dimensions.
- The homepage previously exhibited higher CLS in certain dev audits (e.g., 0.75). We mitigated by:
  - Converting the hero to static/CSS scroll-snap.
  - SSR’ing initial data for above‑the‑fold sections with stable min-heights.
  - Reserving header/island space and ensuring fixed icon sizes.
  - Using `content-visibility: auto` + tuned `contain-intrinsic-size` for below‑the‑fold sections.
  - Prioritizing LCP images with `priority` and `fetchPriority` and removing the custom image loader.
- If a local audit shows spikes, re-run in incognito and optionally append `?lhci=1`. Production should remain stable; please report persistent CLS > 0.1 with a screenshot and the affected markup.

## [1.1.4] - 2025-09-15
### Added
- Auth: centralized typed client helpers at `apps/web/src/lib/auth-client-helpers.ts` covering sign-in (email/username, magic link), sign-up, profile updates, and 2FA (enable/disable/verify/backup codes).

### Changed
- Auth UX: aligned flows to support username or email for login and sign-up; updated profile and security settings to use the new helpers.
- A11y & forms: introduced unique field IDs via `useId()` in key forms (shipping, payment, contact, address) and set default `type="button"` on the app `Button` shim; refined semantic elements for status messaging.
- Branding & copy: updated footer brand to “ModularShop”, refreshed layout description, and minor UI copy improvements.

### Documentation
- Updated `docs/architecture.md` with an “Auth & Identity” section and “Payments Clients & Hooks” notes.
- Updated `docs/frontend-architecture.md` with guidance on the auth client helpers, button default type, and accessibility/unique IDs.

### Fixed
- Corrected `Number.parseInt` usages to include radix where applicable.
- Resolved assorted a11y violations (unique IDs, semantic elements) and minor lint issues in edited files.

## [1.1.3] - 2025-09-13
### Added
- Auth: shared root layout for all auth pages at `apps/web/src/app/(shop)/auth/layout.tsx`.
  - Removed per-page shaded wrappers, unified vertical centering.
  - Standardized form card width to `max-w-md`; aligned login + resend sections.
- Session: added trusted endpoint `GET /api/me` returning `user.isAdmin` computed on the server (role or allowlist).
- i18n: minimal flexible config at `apps/web/src/modules/shared/config/locales.ts` and expanded language options in the `LocaleSwitcher`.
- Docs: added "Minimal, Flexible Locale Setup" section in `docs/i18n.md`.

### Changed
- Auth cookies: in `packages/auth/src/server-auth.ts`, dev fallbacks for cross-site cookies on HTTP localhost.
  - When `ENABLE_CROSS_SITE_COOKIES=true` without HTTPS in dev, fall back to `sameSite=lax; secure=false` to avoid dropped cookies.
- Env & docs: replaced `WEB_ORIGIN` with `APP_URL` across docs and examples; defaulted local `.env` to `ENABLE_CROSS_SITE_COOKIES=false`.

### Fixed
- Resolved "fake login" in local dev caused by rejected Secure/None cookies on HTTP.
- Avatar menu now shows the "Admin" item by relying on `user.isAdmin` from `/api/me` instead of client-only envs.

## [1.1.2] - 2025-09-12
### Added
- Auth UX improvements for email verification:
  - Enabled `emailVerification.sendOnSignIn` and `emailVerification.autoSignInAfterVerification` in `packages/auth/src/server-auth.ts` to recover from missed/failed first emails and streamline post-verification.
- Feature: Resend verification for logged‑out users
  - Server action: `apps/web/src/actions/user/resend-verification-by-email.ts` (validates email with zod and builds an absolute callback URL via `next/headers`).
  - UI: `apps/web/modules/account/components/auth/resend-verification-form.tsx` mounted under the login page at `apps/web/src/app/(shop)/auth/login/page.tsx`.

### Notes
- Existing signed‑in resend flow remains available at `apps/web/src/actions/user/resend-verification-email.ts`.
- Ensure email provider env values are correctly set (e.g., `MAIL_PROVIDER=SMTP | RESEND`) and `APP_URL`/`NEXT_PUBLIC_APP_URL` reflect the actual origin to avoid link/cookie issues.

## [1.1.0] - 2025-09-10
### Added
- Introduced `@repo/payments` package consolidating typed Stripe/PayPal clients for reuse across apps.
- New payments-oriented hooks in `@repo/payments`:
  - `use-stripe-config`, `use-paypal-config`, `use-stripe-intent`, `use-stripe-refund`, `use-paypal-order`.
- Payments setup guide at `docs/payments.md`, linked from `README.md`.

### Changed
- Migrated web app imports to use `@repo/payments` while keeping back-compat re-exports in `apps/web/src/lib/data/payments/*`.
- `PaymentForm` now reflects provider availability based on server configuration endpoints instead of public env vars.
- Split the catch‑all API by adding focused route handlers under `apps/web/src/app/api/v1/payments/...` for Stripe and PayPal. Specific routes take precedence over the catch‑all to reduce serverless bundle size.

## [1.0.0] - 2025-09-04
### Added
- Initial public release of the Next.js E‑Commerce Starter Kit (monorepo).
- Consolidated API via Next.js Route Handlers using Hono.
- Typed API clients with TanStack Query and DTO→UI mapping.
- Payments: Stripe and PayPal integrations with idempotent webhooks.
- Emails via `@repo/mail` with resilient template rendering and retries.
- Admin dashboard CRUD for products and categories with RBAC.
- Wishlist, reviews scaffolding, and affiliate plan documented.
- Testing docs and CI workflow (lint, typecheck, unit/integration/E2E).

### Changed
- Dashboard UX and session handling improvements.

### Known Issues
- Image uploads: local uploads work; further hardening and CDN integration planned post‑1.0.
