# Next.js E‑Commerce Starterkit (Monorepo)

An end‑to‑end, production‑ready foundation for modern commerce. Built to learn from and launch with.

- Full‑stack Next.js 16 + React 19
- Strict TypeScript, modular monorepo, clear boundaries
- Auth, admin, payments, and real API clients out of the box

This template focuses on completeness and maintainability over vanity numbers. It packs practical patterns across the stack—so you can study the code with confidence, customize quickly, and ship faster.

---

![Project Thumbnail](apps/web/public/next-ecommercekit.png)
![Lighthouse](apps/web/public/lighthouse_1.png)
![Lighthouse](apps/web/public/lighthouse_2.png)

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

---

## Performance & CLS (Home vs. Shop)

The screenshots above show a large gap between the homepage and shop page Lighthouse scores. The shop page consistently achieves 100/100 with CLS ≈ 0.006, while the homepage can occasionally score in the 70s due to a transient CLS spike (e.g., 0.75 in one run).

### Why does the homepage sometimes report high CLS?

The homepage contains more above‑the‑fold dynamic UI than the shop page (hero presentation + early sections). In earlier iterations, these areas were rendered by client-only islands that hydrated after first paint, causing content to shift once data and client JS arrived. Even after we stabilized most sections, a few conditions can still inflate CLS in local audits:

- Client islands or controls mounting above the fold before hydration completes.
- Image placeholders without stable dimensions on hero artwork in certain breakpoints.
- Header/islands (cart/wishlist/menu) reflowing when fonts and styles settle.
- Debug-only overlays (dev tools, CLS visualizer) present in local runs; they do not affect the layout flow but can nudge timing and increase sensitivity to small shifts.

In production, we’ve reduced these to near zero, but Lighthouse in dev can still intermittently catch one of these transitions.

### What we fixed already

- SSR initial data for above‑the‑fold listings (Featured/Top‑selling) with stable min-heights to avoid jump-on-hydration.
- Hero converted to a static/CSS scroll-snap section (no JS carousel) to avoid layout moves during mount.
- Header islands given reserved space and consistent icon sizes; announcement bar is opt‑in to avoid top‑of‑page shifts.
- All images use Next/Image (no custom loader) with sizes/aspect ratio and `priority` + `fetchPriority` for LCP images.
- Below‑the‑fold sections use `content-visibility: auto` with tuned `contain-intrinsic-size` to hold space without doing work.
- Client islands that aren’t needed for first paint are moved after primary content to minimize above‑the‑fold layout churn.

### Remaining mitigations (if you still see CLS spikes locally)

- Ensure the hero and any first-screen imagery have an explicit aspect ratio or fixed height at each breakpoint.
- Double‑check any client‑only components that still render before main content; move them after the fold or SSR a placeholder with stable height.
- Prefer `font-display: optional` (already used for Geist fonts) and keep icon sizes fixed in CSS.
- When auditing locally, use an incognito/guest window and close dev overlays; you can also append `?lhci=1` to suppress extra scripts that might skew timings.

### How to reproduce and measure

- Run the app and audit both pages:
  - Home: `http://localhost:3000/`
  - Shop: `http://localhost:3000/shop`
- Use Chrome Lighthouse in a fresh incognito window. Run at least 3 times; focus on “Cumulative Layout Shift”.
- For a visual of shifts during development, we include a dev-only CLS overlay (see `apps/web/src/app/layout.tsx` scripts block). Remove/disable when auditing if you prefer a clean environment.

If you see persistent CLS above 0.1 on the homepage in production, please open an issue with the screenshot and page markup around the hero so we can further tune intrinsic sizes or breakpoints.
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
