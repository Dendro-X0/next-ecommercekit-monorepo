# Next.js E‑Commerce Starterkit (Monorepo)

An end‑to‑end, production‑ready foundation for modern commerce. Built to learn from and launch with.

- Full‑stack Next.js 16 + React 19
- Strict TypeScript, modular monorepo, clear boundaries
- Auth, admin, payments, and real API clients out of the box

This template focuses on completeness and maintainability over vanity numbers. It packs practical patterns across the stack—so you can study the code with confidence, customize quickly, and ship faster.

---

<!-- PLACEHOLDER 1: UI Showcase GIF -->
<!-- [Insert UI & Pages Walkthrough GIF Here] -->
![UI Showcase](docs\assets\next-ecommercekit_1.gif)

![Lighthouse](apps/web/public/lighthouse_1.png)

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)
- [Frontend Architecture](./docs/frontend-architecture.md)
- [Testing](./docs/testing.md)
- [Deployment](./docs/deployment.md)
- [Payments Setup](./docs/payments.md)
- [Media Storage](./docs/media-storage.md)
- [Internationalization](./docs/i18n.md)
- [Env Setup](./ENV_SETUP.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Development Mode Limitations](./docs/dev-mode-limitations.md)
- [Components Inventory](./docs/components.md)
- [Release Notes](./docs/release-notes.md)
- [Roadmap](./ROADMAP.md)

---



## Tech Stack

The kit ships with a pragmatic, production‑ready stack and batteries included:

- Framework: Next.js 16, React 19
- Language: TypeScript (strict)
- Monorepo: Turborepo + pnpm
- API: Hono, mounted via Route Handlers (`apps/web/src/app/api/*`)
- Auth: Better Auth (`@repo/auth`)
- DB/ORM: Postgres + Drizzle (`@repo/db`), centralized migrations/seeds
- UI: Tailwind CSS + shadcn/ui + shared `@repo/ui`
- Data: TanStack Query
- State/URL: Zustand, nuqs
- Email: `@repo/mail` (SMTP in dev, Resend in prod)
- Media Storage: S3 or Cloudinary via `@repo/storage`, with audit logs and optional FFmpeg video previews in `packages/media-worker`
- Payments: Stripe and PayPal via `@repo/payments`
- i18n: shared typed messages and formatters via `@repo/i18n` (also re‑exported by `@repo/ui`)

---

<!-- PLACEHOLDER 2: Tech Stack & Code GIF -->
<!-- [Insert Tech Stack, Code & File Tree GIF Here] -->
![Tech Stack Demo](docs\assets\next-ecommercekit_filetree_1.gif)

## Quickstart

1) Install

```bash
pnpm install
```

2) Environment (`apps/web/.env.local`)

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-long-random-secret
# Local dev cookies (recommended)
ENABLE_CROSS_SITE_COOKIES=false
ENABLE_CROSS_SUBDOMAIN_COOKIES=false
# Optional: show Admin entry in the avatar menu (also enables admin API access)
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

---

## License

MIT — see `LICENSE`.
