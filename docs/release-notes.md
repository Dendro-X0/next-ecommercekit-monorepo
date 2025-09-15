# Release Notes

## v1.1.2 (2025-09-12)
- Storage & Media: Implemented S3-backed uploads at `POST /api/uploads` with local disk fallback in dev.
- Admin Dashboard: Media uploader now persists real image/video URLs and previews; primary image selection works with persisted media.
- i18n & SEO: Language alternates in metadata and localized sitemap with real category URLs; JSON-LD for PDP and Category pages; locale-aware currency/date formatting utilities.
- Accessibility: Enabled `eslint-plugin-jsx-a11y`; fixed blocking a11y issues in admin components.

## v1.1.0 (2025-09-10)
- Auth/session flows complete (email verification, redirects, header session refresh)
- Catalog browse (categories/products) wired to API with loading/error states
- PDP + Wishlist toggle stable (PLP/PDP), E2E passing
- Checkout → Order (Stripe/PayPal supported) and order success page
- Payments: Stripe and PayPal integrations with idempotent webhooks; shared clients/hooks in `@repo/payments`
- Split payments endpoints under `apps/web/src/app/api/v1/payments/**` for smaller server bundles
- User dashboard: minimal Orders history
- Contact form: backend (validation, email, rate limiting, DB) + E2E

### Known Limitations
- SEO and deep-linked filters/sorts deferred
- Advanced observability and distributed rate limiting deferred
- Admin marketing/affiliate/email features deferred
