# Architecture

## Tech Stack (Summary)
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
- Storage: `@repo/storage` with S3 or Cloudinary providers; image loader/CDN integration
- Media Worker: `packages/media-worker` for FFmpeg-based video preview generation

## Monorepo Layout (Overview)
- `apps/web` — Next.js app (frontend + API Route Handlers)
- `packages/api` — Hono app (routes/middleware) used by web
- `packages/auth` — Better Auth server instance/config
- `packages/db` — Drizzle schema, migrations, seeding
- `packages/mail` — Mail transport abstraction
- `packages/ui` — Shared UI primitives
- `packages/payments` — Shared typed payments clients and React Query hooks
- `packages/*-config` — Shared TS/ESLint configs

## API Conventions
- Base: `/api/v1/*`
- Responses: Zod‑validated; errors as `{ error, code }`
- Pagination: `page`, `pageSize`, `total`
- Sorting: `newest`, `price_asc`, `price_desc`, `rating`, `popularity`
- Auth: Better Auth; admin routes protected by `ensureAdmin`
- Payments endpoints are mounted under `/api/v1/payments/**` using focused route handlers to reduce serverless bundle size.
