# Payments Setup (Stripe + PayPal + Polar optional)

This template ships with complete, idempotent server integrations and typed clients.
Use this checklist to configure payments on Vercel quickly.

## 1) Environment Variables (Vercel)

Paste the following into your Vercel Project Settings → Environment Variables.
Set for Production and Preview. Re-deploy with “Clear build cache”.

Stripe
- STRIPE_SECRET_KEY = sk_live_... or sk_test_...
- STRIPE_WEBHOOK_SECRET = whsec_...
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_... or pk_test_...

PayPal
- PAYPAL_CLIENT_ID = ...
- PAYPAL_CLIENT_SECRET = ...
- PAYPAL_MODE = sandbox or live
- PAYPAL_WEBHOOK_ID = ...

Polar (optional)
- POLAR_ACCESS_TOKEN = ...
- POLAR_SERVER = sandbox or production
- POLAR_SUCCESS_URL = https://your-domain.com/polar/success

Base URL
- WEB_ORIGIN = https://your-domain.com

Optional (Hobby relief)
- NEXT_UNOPTIMIZED_IMAGES = true

## 2) Webhook Endpoints

Create two webhooks pointing to your deployment (or local tunnel):

Stripe
- URL: https://your-domain.com/api/v1/payments/stripe/webhook
- Events: payment_intent.succeeded, payment_intent.canceled, payment_intent.processing, payment_intent.payment_failed, payment_intent.amount_capturable_updated, charge.refunded
- Copy the signing secret into STRIPE_WEBHOOK_SECRET

PayPal
- URL: https://your-domain.com/api/v1/payments/paypal/webhook
- Events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, PAYMENT.CAPTURE.REFUNDED
- Copy the Webhook ID into PAYPAL_WEBHOOK_ID

## 3) What’s Implemented

Server (packages/api)
- Stripe
  - POST /api/v1/payments/stripe/intent (idempotent by key)
  - POST /api/v1/payments/stripe/capture (admin)
  - POST /api/v1/payments/stripe/refund (admin)
  - POST /api/v1/payments/stripe/webhook (idempotent by event id)
- PayPal
  - GET /api/v1/payments/paypal/config
  - POST /api/v1/payments/paypal/create
  - POST /api/v1/payments/paypal/capture
  - POST /api/v1/payments/paypal/webhook (idempotent by transmission id)

- Polar (optional)
  - GET /api/v1/payments/polar/checkout (creates a hosted checkout and returns a redirect URL)

Business effects
- Orders move between pending/paid/cancelled
- Inventory commit on paid, restock on cancel/refund
- Transactional emails on paid/cancelled/refunded (if RESEND is configured)

## 4) Client Usage

Use the shared typed clients from the monorepo package `@repo/payments`:

```ts
import { paymentsStripeApi } from "@repo/payments/client/stripe"
import { paymentsPaypalApi } from "@repo/payments/client/paypal"
import { paymentsPolarApi } from "@repo/payments/client/polar"
```

The checkout UI (`apps/web`) reads provider availability from the server via
`paymentsStripeApi.config()` and `paymentsPaypalApi.config()`.

Polar is used for separate hosted checkout flows (for example, selling standalone
templates or add-ons) and is not wired into the main `/checkout` cart UI by
default. To use it, call `paymentsPolarApi.createCheckout` from a dedicated flow
and redirect the user to the returned URL.

Stripe Elements wrapper: `apps/web/modules/shop/components/checkout/stripe-payment-element.tsx`.

## 5) Test Locally

- Stripe CLI (recommended)
  - `stripe listen --forward-to localhost:3000/api/v1/payments/stripe/webhook`
  - Copy the signing secret into STRIPE_WEBHOOK_SECRET
- PayPal Sandbox: ensure `PAYPAL_MODE=sandbox` and credentials are from developer.paypal.com

## 6) Idempotency

- Stripe intent creation caches the response by Idempotency-Key and request hash
- Webhooks (Stripe and PayPal) ignore duplicate deliveries by unique key (event id / transmission id)

## 7) Troubleshooting

- 501 Not Implemented from any payment endpoint → provider not configured (missing env).
- Orders not updated after payment → verify webhook secrets/IDs and logs in Stripe/PayPal dashboards.
- Hobby sluggishness → keep NEXT_UNOPTIMIZED_IMAGES=true; payments routes are already split by default under `/api/v1/payments/**`. Consider splitting additional API domains if your server bundle grows.
