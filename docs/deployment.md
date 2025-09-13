# Deployment

This project deploys well to Vercel (recommended). The API lives in Next.js Route Handlers, so a single deploy serves both UI and API.

## 1) Database

- Use Neon or Supabase (Postgres). Copy the connection string to `DATABASE_URL`.

## 2) Minimal environment variables

Set these in the Vercel Project (Environment Variables):

- `DATABASE_URL` — Postgres connection
- `APP_URL` — e.g., `https://your-domain.com` (or Vercel preview URL)
- `NEXT_PUBLIC_APP_URL` — same as `APP_URL`
- `BETTER_AUTH_SECRET` — long random string
- `ADMIN_EMAILS` — comma-separated admin emails for the dashboard
- `NEXT_PUBLIC_ADMIN_EMAILS` — optional; falls back to `ADMIN_EMAILS`

Optional (emails/payments; warnings only if missing in production):

- `RESEND_API_KEY` and `EMAIL_FROM` — enable transactional emails
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` — enable PayPal
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — enable Stripe

Frontend toggles (defaults are safe):

- `NEXT_PUBLIC_BOOT_MINIMAL=false` — ensures full UI providers in prod
- `NEXT_PUBLIC_FRONTEND_ONLY=false` — must be `false` for real auth

## 3) Auth cookies

Configure Better Auth cookies for your domain(s):

- Cross‑site flows require `SameSite=None` and `Secure=true` (handled by configuration). Ensure HTTPS is enabled on custom domains.
- In local development over HTTP, set `ENABLE_CROSS_SITE_COOKIES=false` so cookies are accepted by the browser.

## 4) Deploy

1. Connect the GitHub repo in Vercel.
2. Add the env vars above (Production and Preview as needed).
3. Deploy. The app should build without payment keys; related endpoints remain disabled with warnings.

Troubleshooting: see `docs/troubleshooting.md`.
