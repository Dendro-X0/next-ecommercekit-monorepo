# Changelog

All notable changes to this project will be documented in this file.

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
