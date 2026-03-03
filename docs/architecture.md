# Architecture (Full‑Stack)

This document describes how the monorepo is structured, how requests flow through the system, and where to make changes safely.

## Tech Stack (Summary)
- Framework: Next.js 16, React 19
- Language: TypeScript (strict)
- Monorepo: Turborepo + pnpm
- API: Hono mounted via Next.js Route Handlers (`apps/web/src/app/api/*`)
- Auth: Better Auth (`@repo/auth`) at `/api/auth/[...all]`
- DB/ORM: Postgres + Drizzle (`@repo/db`), centralized migrations/seeds
- UI: Tailwind CSS + shadcn/ui + shared `@repo/ui` plus app-level shims
- Data: TanStack Query
- Email: `@repo/mail` (SMTP in dev, Resend in prod)
- Storage: `@repo/storage` (S3/Cloudinary) + optional media worker (`packages/media-worker`)

## Monorepo File Tree (Authoritative)

This is the conceptual tree you should use when orienting yourself:

```
.
├─ apps/
│  └─ web/
│     ├─ src/
│     │  ├─ app/                         # Next.js App Router
│     │  │  ├─ (shop)/                   # public shop routes
│     │  │  ├─ (auth)/                   # auth-only layout group
│     │  │  ├─ dashboard/                # private routes (user + admin)
│     │  │  └─ api/[[...rest]]/route.ts  # API proxy → packages/api Hono app
│     │  ├─ lib/                         # app-level clients, helpers, glue
│     │  │  └─ data/                     # thin fetch clients (e.g., adminApi)
│     │  └─ components/                  # app components (non-shim)
│     ├─ modules/
│     │  ├─ ui/components/               # app UI shims (mapped to @/components/ui/*)
│     │  ├─ shared/                      # shared app-only helpers/components
│     │  ├─ marketing/                   # home/contact
│     │  ├─ shop/                        # PDP/PLP/cart/checkout components
│     │  └─ account/                     # user account components
│     ├─ proxy.ts                        # Next.js 16 auth gate for /dashboard
│     └─ tsconfig.json                   # path aliases used throughout apps/web
│
├─ packages/
│  ├─ api/                               # Hono app (the backend)
│  │  └─ src/
│  │     ├─ routes/                      # /api/v1/* route modules
│  │     ├─ catalog/                     # switchable catalog adapter + providers
│  │     ├─ lib/                         # guards/validation helpers
│  │     └─ env.ts                       # API env schema/validation
│  ├─ auth/                              # Better Auth server instance/config
│  ├─ db/                                # Drizzle schema + repos
│  ├─ payments/                          # typed clients + hooks
│  ├─ storage/                           # typed clients + hooks
│  ├─ ui/                                # shared UI primitives
│  └─ ...
│
└─ docs/                                 # documentation (this folder)
```

## Runtime Relationships (What calls what)

### Browser → Web app
- UI is rendered by `apps/web` (Next.js App Router).
- Data access in the UI should go through fetch clients in `apps/web/src/lib/data/*`.
- Most dashboard/admin screens use TanStack Query to call `GET/POST/PATCH/DELETE /api/v1/*`.

### Browser → API
- `/api/v1/*` requests are handled by the Next.js route handler:
  - `apps/web/src/app/api/[[...rest]]/route.ts`
- That handler mounts/proxies the `@repo/api` Hono app.

### API → domain services
- The Hono app lives in `packages/api/src`.
- It depends on:
  - `@repo/db` repositories for persistence (native catalog, orders, etc.)
  - `@repo/auth` for session/auth integration (via guards)
  - `@repo/payments` / `@repo/storage` as needed

## API Conventions
- Base: `/api/v1/*`
- Errors: JSON `{ error: string }` (and optionally `{ code }` depending on route)
- Pagination: `page`, `pageSize`, `total`

## Auth & Access Control

### Server
- Better Auth route: `/api/auth/[...all]`.
- Admin-only endpoints in `packages/api` must call `AdminGuard.ensureAdmin(c)`.

### Web
- `/dashboard/**` is protected by `apps/web/proxy.ts` (auth gating/redirect).
- Admin layout (`apps/web/src/app/dashboard/admin/layout.tsx`) enforces admin access.

## Catalog Providers (Adapter Architecture)

The catalog layer is implemented via an adapter so the backend can switch providers:

- `CATALOG_PROVIDER=native | shopify | medusa`

Provider implementations live under:

- `packages/api/src/catalog/providers/*`

Adapter selection is handled by:

- `packages/api/src/catalog/factory.ts`

Behavior:

- `native`
  - Uses `@repo/db` repos
  - Supports full write operations
- `shopify` and `medusa`
  - Read-only in this starterkit
  - Writes are blocked at the API layer via `adapter.capabilities.supportsWrite`

Admin meta endpoint:

- `GET /api/v1/admin/catalog-meta`

This is consumed by the admin UI to render a read-only banner and disable product CRUD.

Details: see `docs/catalog-providers.md`.

## Frontend Architecture (Integrated)

### UI shims and import rules
- App code should not import Radix directly (`@radix-ui/*`). Prefer app shims:
  - `@/components/ui/*` → mapped to `apps/web/modules/ui/components/*`
- Avoid using `asChild` directly in app code; use the app shims.

### TypeScript paths
- `apps/web/tsconfig.json` maps:
  - `@/*` → `apps/web/src/*`
  - `@/components/ui/*` → `apps/web/modules/ui/components/*`

### Composition safeguards
- The app `Button` shim maps legacy `asChild` behavior onto a safer polymorphic API.
- The shim also defaults `type="button"` to prevent accidental form submission; pass `type="submit"` explicitly.

### Where to change things (common tasks)

Catalog:
- Provider logic: `packages/api/src/catalog/*`
- Shop browse endpoints: `packages/api/src/routes/products.ts`, `packages/api/src/routes/categories.ts`
- Admin meta endpoint: `packages/api/src/routes/admin.ts`

Admin UI gating:
- Global banner: `apps/web/src/app/dashboard/admin/_components/catalog-readonly-banner.tsx`
- Product UI actions: `apps/web/src/app/dashboard/admin/_components/products-table.tsx`
- Product create/edit form: `apps/web/src/app/dashboard/admin/_components/product-form.tsx`

Payments:
- Server endpoints: `apps/web/src/app/api/v1/payments/**`
- Shared clients/hooks: `packages/payments/*`

## Development & Maintenance

The web workspace includes scripts to keep UI imports consistent:

```bash
pnpm --filter web run report:radix-imports
pnpm --filter web run codemod:radix-to-shims:dry
pnpm --filter web run codemod:radix-to-shims
```
