# Getting Started

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
# Local dev cookies (recommended)
ENABLE_CROSS_SITE_COOKIES=false
ENABLE_CROSS_SUBDOMAIN_COOKIES=false
# Optional: server allowlist for admin access and the avatar menu "Admin" label
ADMIN_EMAILS=admin@example.com
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

## Scripts
- `pnpm dev` — start Next.js (API included)
- `pnpm build` — build web
- `pnpm lint` / `pnpm typecheck` — quality gates
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:seed`
- `pnpm test` — unit/integration
- `pnpm e2e` — Playwright E2E
