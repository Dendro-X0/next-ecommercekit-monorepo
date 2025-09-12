# Next.js E‑Commerce Starterkit (Monorepo)

An end‑to‑end, production‑ready foundation for modern commerce. Built to learn from and launch with.

- Full‑stack Next.js 15 + React 19
- Strict TypeScript, modular monorepo, clear boundaries
- Auth, admin, payments, and real API clients out of the box

This template focuses on completeness and maintainability over vanity numbers. It packs practical patterns across the stack—so you can study the code with confidence, customize quickly, and ship faster.

---

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Frontend Architecture](./docs/frontend-architecture.md)
- [Testing](./docs/testing.md)
- [Deployment](./docs/deployment.md)
- [Payments Setup](./docs/payments.md)
- [Media Storage](./docs/media-storage.md)
- [Env Setup](./ENV_SETUP.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Development Mode Limitations](./docs/dev-mode-limitations.md)
- [Components Inventory](./docs/components.md)
- [Release Notes](./docs/release-notes.md)
- [Roadmap](./ROADMAP.md)

---

## Tech Stack

- Framework: Next.js 15, React 19
- Language: TypeScript (strict)
- Monorepo: Turborepo + pnpm
- API: Hono mounted via Route Handlers (`apps/web/src/app/api/*`)
- Auth: Better Auth (`@repo/auth`) at `/api/auth/[...all]`
- DB/ORM: Postgres + Drizzle (`@repo/db`), centralized migrations/seeds
- UI: Tailwind CSS + shadcn/ui + shared `@repo/ui`
- Data: TanStack Query (queries/mutations, optimistic updates)
- State/URL: Zustand, nuqs
- Email: `@repo/mail` (SMTP in dev, Resend in prod)
- Media Storage: S3-backed uploads via `/api/uploads` (local disk fallback in dev)

---

## Monorepo Layout

- `apps/web` — Next.js app (frontend + API Route Handlers)
- `packages/api` — Hono app (routes/middleware) used by web
- `packages/auth` — Better Auth server instance/config
- `packages/db` — Drizzle schema, migrations, seeding
- `packages/mail` — Mail transport abstraction
- `packages/ui` — Shared UI primitives
- `packages/payments` — Shared typed payments clients and hooks
- `packages/*-config` — Shared TS/ESLint configs

---

## Quickstart

1) Install

```bash
pnpm install
```

2) Environment (`apps/web/.env.local`)

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-long-random-secret
```

3) Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed   # optional demo data
```

4) Develop

```bash
pnpm dev
```

---

## Scripts

- `pnpm dev` — start Next.js (API included)
- `pnpm dev:safe` — start Next.js with the minimalist safe-mode homepage (sets `NEXT_PUBLIC_SAFE_HOME=true`)
- `pnpm build` — build web
- `pnpm lint` / `pnpm typecheck` — quality gates
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed`
- `pnpm -C packages/api test` — API unit/integration tests (Vitest)
- `pnpm -C apps/web test:e2e` — Playwright E2E (web)

---

## Conventions

- Typed clients live under the app (`apps/web/src/lib/data/*`) or shared packages like `@repo/payments` (one export per file)
- TanStack Query for all server interactions (queries + mutations)
- Query Keys collocated (e.g., `apps/web/src/lib/wishlist/query-keys.ts`)
- DTO→UI mapping at the client boundary; Zod schemas where applicable
- Avoid `any`; add explicit parameter/return types; use small, single‑purpose functions

---

## API

See [Architecture](./docs/architecture.md) (API conventions).

---

## Current Status

See “Status & v1.0 scope” below and [Release Notes](./docs/release-notes.md).

---

## Roadmap (Summary)

- U1: Addresses & Preferences — user settings foundations
- U2: Cart Persistence — server‑backed cart + client sync
- U3: Orders — checkout creates orders; order success; dashboard history
- U4: Wishlist — add/remove + dashboard
- U5: Reviews — PDP reviews + moderation
- U6: Affiliate — referral code + stats
- A: Admin CRUD — products/categories with RBAC
- H: Hardening — security headers, rate limits, logs, tests

Full detail: `ROADMAP.md`.

---

## Status & v1.0 scope

- Current focus: ship a stable v1.0 with core flows (auth, browse, PDP, cart, checkout→order, orders history, wishlist, contact).
- Payments: Stripe and PayPal integrations include idempotent intent/capture flows and webhook handling with duplicate-delivery protection. Comprehensive integration tests for both providers are passing.
- Remaining: E2E coverage (happy path, 3DS/failure/refund), CI polish, and SEO/deep-linked filters. Observability has initial coverage (rate limiting, validation, metrics).
- Details: see `./docs/release-notes.md`.

---

## Development Guidelines

- Use TanStack Query for data fetching/mutations (no manual `useEffect` for server data)
- Prefer optimistic updates and `invalidateQueries` on success
- Keep UI deterministic: loading skeletons, error states, and `data-testid` for E2E
- Use typed DTOs and mapping utilities; avoid leaking server DTOs into UI
- Follow monorepo import rules (prefer `@/modules/*`, `@repo/*`)

## Development Mode Limitations (Summary)

This project prioritizes production performance. In development, dev prefetch and HMR can cause heavy route compilation when paired with large client trees (e.g., navigation dropdowns). We mitigate this by using RSC for `Header`/`Footer`, tiny client islands for interactivity, disabling `next/link` prefetch in critical areas, and keeping the Shop page SSR-first.

Use the following flags in `apps/web/.env.local` for a quiet dev baseline:

```bash
NEXT_PUBLIC_DISABLE_TOASTER=true
NEXT_PUBLIC_DISABLE_CART_HYDRATOR=true
NEXT_PUBLIC_DISABLE_AFFILIATE_TRACKER=true
NEXT_PUBLIC_DISABLE_HEADER_INTERACTIONS=false
NEXT_PUBLIC_USE_UI_TEMPLATES=false
NEXT_PUBLIC_USE_UI_TEMPLATES_SHOP=false
```

Verify production is smooth (dev overhead doesn’t apply to prod):

```bash
pnpm --filter web build
pnpm --filter web start
```

See the full rationale and checklist in [Development Mode Limitations](./docs/dev-mode-limitations.md).

---

## Dev Modes: Full UI vs Safe Mode

Use safe mode to keep development responsive on large projects or slower hardware.

- `pnpm dev` (default)
  - No special env is set.
  - The homepage (`/`) redirects to `/shop` (full UI), which keeps navigation predictable.

- `pnpm dev:safe` (recommended for heavy dev sessions)
  - Sets `NEXT_PUBLIC_SAFE_HOME=true` via `cross-env`.
  - The homepage (`/`) renders a minimalist landing page defined in `apps/web/src/app/page.tsx`.
  - Navigate to `/shop` for the full storefront. This defers heavy client bundles while keeping the app usable.

To enable safe mode persistently, you can also add to `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SAFE_HOME=true
```

For production, leave `NEXT_PUBLIC_SAFE_HOME` unset (or `false`). The homepage will redirect to `/shop`.

---

## Troubleshooting (Quick)

See `./docs/troubleshooting.md` for common issues, local cookie settings, and fixes.

---

## Deployment

See [Deployment](./docs/deployment.md).

---

## License

MIT — see `LICENSE`.

---

For detailed guides, check the `docs/` directory linked above. The README intentionally stays concise.
