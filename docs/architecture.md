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
- `packages/emails` — Email templates and utilities
- `packages/eslint-config` — Shared ESLint config
- `packages/i18n` — i18n config and utilities
- `packages/mail` — Mail transport abstraction
- `packages/media-worker` — Media worker for FFmpeg-based video preview generation
- `packages/payments` — Shared typed payments clients and React Query hooks
- `packages/storage` — Shared storage client and React Query hooks
- `packages/ui` — Shared UI primitives
- `packages/*-config` — Shared TS/ESLint configs

## API Conventions
- Base: `/api/v1/*`
- Responses: Zod‑validated; errors as `{ error, code }`
- Pagination: `page`, `pageSize`, `total`
- Sorting: `newest`, `price_asc`, `price_desc`, `rating`, `popularity`
- Auth: Better Auth; admin routes protected by `ensureAdmin`
- Payments endpoints are mounted under `/api/v1/payments/**` using focused route handlers to reduce serverless bundle size.

## Auth & Identity
- Server: Better Auth is mounted at `/api/auth/[...all]` (see `packages/auth`). The username plugin is enabled; users can authenticate with either username or email.
- Client (web): All auth-related calls are centralized in `apps/web/src/lib/auth-client-helpers.ts`. Use these helpers (e.g., `signInEmail`, `signInUsername`, `signInMagicLink`, `signUpEmail`, `updateUserProfile`, `twoFactorEnable/Disable/VerifyTotp/GenerateBackupCodes`) instead of calling `authClient.*` plugin methods directly. This guarantees consistent typings and eliminates scattered casts.

## Payments Clients & Hooks
- Shared, typed Stripe/PayPal clients and React Query hooks live in `packages/payments`. The web app consumes these via `@repo/payments/*` (e.g., `use-stripe-config`, `use-paypal-config`) and calls endpoints under `/api/v1/payments/**`.
