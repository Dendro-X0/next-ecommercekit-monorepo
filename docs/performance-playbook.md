# Performance Playbook (Next.js 15 Monorepo)

This guide captures practical steps to keep deployments smooth on Vercel (Hobby/Pro) and to keep bundles and serverless invocations lean.

## 1) Measure first

- Bundle analyzer (client + server):
  - One-off: `ANALYZE=true pnpm --filter web build`
  - Artifacts: `.next/analyze/client.html` and `.next/analyze/server.html`
- Log SSR hot paths (production only):
  - Add lightweight timing logs around expensive SSR pages/route handlers.

## 2) Images

- Case sensitivity matters in production. All public asset references must match case exactly.
  - This repo fixed: `shop1.png`, `admin_dashboard1.png`, `user_dashboard1.png` in `apps/web/public/`.
- If Hobby plan struggles with on-the-fly optimization, disable temporarily:
  - Set `NEXT_UNOPTIMIZED_IMAGES=true` (already supported via `apps/web/next.config.ts`).
- Allow only necessary remote hosts in `images.remotePatterns`.

## 3) Serverless/Edge behavior on Vercel

- Keep server bundles small and predictable:
  - Avoid cross-route imports and route-group CSS imports. Keep `app/` pages/components self-contained.
  - Lazy load heavy client-only widgets via `next/dynamic({ ssr: false })`.
  - Prefer shared UI in `modules/` over importing pages from other route groups.
- Force Node runtime where needed (already set):
  - `apps/web/src/app/api/[[...rest]]/route.ts` exports `runtime = "nodejs"`.

## 4) Caching and revalidation

- API responses (Hono in `@repo/api`) now include Cache-Control headers:
  - Categories, product lists, and featured lists: `s-maxage=60, stale-while-revalidate=300`.
  - Product detail: `s-maxage=120, stale-while-revalidate=600`.
- In pages/components, prefer `fetch(url, { next: { revalidate: N } })` when SSR fetching is needed.
- Prefer static/ISR for marketing and listing pages; use client fetch for interactive filters.

## 5) Monorepo and bundling

- `transpilePackages` should include only packages used by the web app. This repo currently includes UI/Auth/DB/API/Emails/Mail because auth/mail templates flow through `@repo/auth`.
- Keep server-only libraries out of client components; keep client-only libs out of server files.

## 6) UI interaction hotspots

- Dropdowns/mega menus can introduce long tasks on weak devices. We converted the “Categories” dropdown into a simple link.
- Consider reducing motion/animation on initial render and enable on first interaction.

## 7) Environment checklist (Vercel)

- `WEB_ORIGIN` = production URL (with scheme, no trailing slash)
- `NEXT_PUBLIC_APP_URL` = same as `WEB_ORIGIN`
- Optional: `APP_URL` = same
- Optional (Hobby relief): `NEXT_UNOPTIMIZED_IMAGES=true`
- Clear build cache after structural changes (routing, config, CSS paths).

## 8) Common pitfalls and fixes

- ENOENT for `client-reference-manifest`:
  - Caused by cross-route imports or duplicate index pages within a route group.
  - Fix: extract shared components, remove duplicate `app/(group)/page.tsx` if `app/page.tsx` exists.
- 404 for images in production but not dev:
  - Usually case mismatch or file missing in `public/`. Fix file names and references.

## 9) Scripts

- Build (prod): `pnpm --filter web build`
- Start (prod): `pnpm --filter web start`
- Optional analyze build: `ANALYZE=true pnpm --filter web build`

## 10) Next steps

- Run the analyzer and review the top offenders (client and server).
- If server bundles are large, consider trimming `transpilePackages` and splitting heavy modules with `dynamic()`.
- Set short `revalidate` on SSR listing routes if needed.
- If still constrained on Hobby, flip `NEXT_UNOPTIMIZED_IMAGES=true` until moving to Pro.
