# @repo/payments

Typed client utilities for Payments used across apps. Currently provides:

- Stripe client: `@repo/payments/client/stripe`
- PayPal client: `@repo/payments/client/paypal`
- Polar client (optional hosted checkouts): `@repo/payments/client/polar`
- React Query hooks:
  - `@repo/payments/hooks/use-stripe-config`
  - `@repo/payments/hooks/use-paypal-config`
  - `@repo/payments/hooks/use-stripe-intent`
  - `@repo/payments/hooks/use-stripe-refund`
  - `@repo/payments/hooks/use-paypal-order`

Server routes live in `packages/api/src/routes/`:
- `payments-stripe.ts`
- `payments-paypal.ts`

## Usage

```ts
import { paymentsStripeApi } from "@repo/payments/client/stripe"
import { paymentsPaypalApi } from "@repo/payments/client/paypal"
import { paymentsPolarApi } from "@repo/payments/client/polar"
// Hooks
import { useStripeConfig } from "@repo/payments/hooks/use-stripe-config"
import { usePaypalConfig } from "@repo/payments/hooks/use-paypal-config"
import { useStripeIntent } from "@repo/payments/hooks/use-stripe-intent"
import { useStripeRefund } from "@repo/payments/hooks/use-stripe-refund"
import { usePaypalCreateOrder, usePaypalCapture } from "@repo/payments/hooks/use-paypal-order"
```

Both clients call the backend endpoints under `/api/v1/payments/...`.

## Environment

Configure on the server (Vercel project envs):

- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
  - Webhook to: `/api/v1/payments/stripe/webhook`
- PayPal
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_MODE` = `sandbox | live`
  - `PAYPAL_WEBHOOK_ID`
  - Webhook to: `/api/v1/payments/paypal/webhook`
- Polar (optional)
  - `POLAR_ACCESS_TOKEN`
  - `POLAR_SERVER` = `sandbox | production`
  - `POLAR_SUCCESS_URL` (optional success redirect)
- Base URL
  - `WEB_ORIGIN` (e.g., https://your-domain.com)

## Notes

- Clients return typed objects and throw on non-2xx statuses.
- Stripe intent creation supports the `Idempotency-Key` header via options.
- PayPal flow is server-driven (no PayPal JS SDK required).
