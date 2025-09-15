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

---

## Vercel Project Settings (Monorepo)

Recommended settings for this repository structure:

- Framework Preset: `Next.js`
- Build Command: `pnpm -w --filter web build`
- Output Directory: `.next`
- Install Command: `corepack enable && pnpm install --frozen-lockfile`
- Root Directory: `apps/web`
- Include files outside root directory: Enabled

Note: The above matches the screenshot in our README and ensures the `apps/web` workspace builds against the monorepo lockfile with pnpm.

---

## Deploy with OpenDeploy CLI (optional but recommended)

You can automate env validation, syncing, and deploys using the OpenDeploy CLI that ships alongside these starter kits. The examples below assume you run from the monorepo root.

### 1) Doctor

```bash
node "./OpenDeploy CLI/dist/index.js" doctor --json
```

Confirms Node/pnpm/CLIs, Vercel/Netlify auth, and monorepo link state. It also reports which `apps/*` sub‑apps are linked and the chosen deploy cwd (so deploys run from the correct directory).

### 2) Validate env (composition)

Use builtin schemas to quickly ensure required keys exist in your `.env` files.

```bash
node "./OpenDeploy CLI/dist/index.js" env validate \
  --file ./apps/web/.env.local \
  --schema builtin:better-auth,builtin:email-basic,builtin:admin-emails,builtin:stripe,builtin:paypal,builtin:s3-compat \
  --json --ci
```

### 3) Diff and Sync env

Compare local to Vercel (CI guardrails):

```bash
node "./OpenDeploy CLI/dist/index.js" env diff vercel \
  --file ./apps/web/.env.production.local \
  --env prod \
  --project-id <VERCEL_PROJECT_ID> --org-id <VERCEL_ORG_ID> \
  --ignore NEXT_PUBLIC_* \
  --fail-on-add --fail-on-remove \
  --json --ci
```

Apply changes (preview/prod as desired):

```bash
node "./OpenDeploy CLI/dist/index.js" env sync vercel \
  --file ./apps/web/.env.production.local \
  --env prod \
  --project-id <VERCEL_PROJECT_ID> --org-id <VERCEL_ORG_ID> \
  --only NEXT_PUBLIC_*,DATABASE_URL \
  --yes --json
``;

### 4) Deploy (Vercel)

```bash
node "./OpenDeploy CLI/dist/index.js" deploy vercel \
  --env prod \
  --path apps/web \
  --project <VERCEL_PROJECT_ID> --org <VERCEL_ORG_ID> \
  --json
```

If something fails:

```bash
# Open Vercel dashboard for the chosen cwd
node "./OpenDeploy CLI/dist/index.js" open vercel --path apps/web --project <VERCEL_PROJECT_ID> --org <VERCEL_ORG_ID>

# Fetch logs for a deployment URL (from the deploy JSON output)
node "./OpenDeploy CLI/dist/index.js" logs vercel --url https://your-deploy.vercel.app --path apps/web
```

### Netlify (parity)

You can also deploy to Netlify with parity commands:

```bash
node "./OpenDeploy CLI/dist/index.js" deploy netlify \
  --env prod \
  --path apps/web \
  --project <NETLIFY_SITE_ID> \
  --json
```

`env pull|diff` support `--context production|branch|deploy-preview` for context‑specific values on Netlify.
