# Development-Mode Performance & Limitations

This project ships with a production-first architecture. In development, certain Next.js behaviors can create heavy overhead when combined with large client trees. This page explains the symptoms, causes, mitigations, and the exact flags to keep dev smooth.

## Summary

- Dev-mode can freeze when route prefetch and HMR attempt to compile/warm large graphs of client components (e.g., header dropdowns).
- We mitigated this by:
  - Converting `Header` and `Footer` to server components (RSC) and moving interactive bits to tiny client islands.
  - Disabling `next/link` prefetch (`prefetch={false}`) across header/footer/product links.
  - Rendering the Shop page server-side only (SSR fallback) to avoid client hydration.
  - Gating global client helpers in layout behind env flags (`Toaster`, `CartHydrator`, `AffiliateTracker`).
- Production builds run smoothly and are not affected by dev-only overhead.

## Quick Setup: Stable Dev Baseline

In `apps/web/.env.local` set:

```bash
# Keep UI and data enabled, but disable heavy global helpers in dev
NEXT_PUBLIC_DISABLE_TOASTER=true
NEXT_PUBLIC_DISABLE_CART_HYDRATOR=true
NEXT_PUBLIC_DISABLE_AFFILIATE_TRACKER=true

# Keep header interactive; set to true if you want it inert for debugging
NEXT_PUBLIC_DISABLE_HEADER_INTERACTIONS=false

# Keep UI templates off (use real pages)
NEXT_PUBLIC_USE_UI_TEMPLATES=false
NEXT_PUBLIC_USE_UI_TEMPLATES_SHOP=false
```

Then restart dev:

```bash
pnpm --filter web dev:webpack
```

## Verify Production Is Smooth

```bash
pnpm --filter web build
pnpm --filter web start
```

If production is smooth but dev stalls, it confirms dev-only overhead. Keep the flags above for fast iteration.

## What Causes Dev-Only Stalls

- `next/link` prefetch on hover can trigger background route compilation and data preloads in dev.
- Large client component trees (global header/footer, all-at-once UI primitives) increase hydration/HMR work.
- Global clients mounted in the layout (`Toaster`, `CartHydrator`, analytics) execute on every route.

## What We Changed in the Codebase

- `apps/web/modules/shared/components/header.tsx` — now an RSC shell.
  - Client islands: `islands/wishlist-badge.tsx`, `islands/auth-menu.tsx`.
- `apps/web/modules/shared/components/footer.tsx` — RSC.
- `apps/web/src/app/(shop)/shop/page.tsx` — renders `server.tsx` SSR fallback.
- Dev prefetch disabled in:
  - `header.tsx`, `navigation-dropdown.tsx`, `footer.tsx`, `product-card.tsx`, `related-products.tsx`, `cart-drawer.tsx`.
- Layout flags in `apps/web/src/app/(shop)/layout.tsx`:
  - `NEXT_PUBLIC_DISABLE_TOASTER`
  - `NEXT_PUBLIC_DISABLE_CART_HYDRATOR`
  - `NEXT_PUBLIC_DISABLE_AFFILIATE_TRACKER`

## Recommended Practices

- Prefer RSC for layout/shell; hydrate only small islands.
- Default `prefetch={false}` on `next/link` for internal navigation in dev. Consider an `AppLink` wrapper that sets `prefetch={false}` by default.
- Keep Shop SSR-first; progressively enhance with client islands (filters, wishlist) behind feature flags.
- Defer non-critical fetching with `requestIdleCallback` or timeouts; always guard queries with `enabled`.

## When Performance Regresses

- Re-check that new links don’t enable prefetch.
- Avoid adding global client mounts to the layout; dynamically import them or guard with env flags.
- Validate visibility gating on per-card queries (e.g., wishlist checks) and use bulk priming.
- Use production run to confirm whether the issue is dev-only.

## FAQ

- “Why does hovering a menu sometimes freeze dev?”
  - In dev, `next/link` prefetch can compile and warm all routes for a dropdown. With many client components, this can saturate the tab. We disable prefetch in the header and dropdown.
- “Can I turn features back on?”
  - Yes. Flip env flags back to `false` selectively and re-check responsiveness.
- “Should I create a fresh storefront?”
  - If you want a clean slate, create `apps/web-lite/` with SSR-only pages and keep this app as the dashboard/admin suite. The APIs remain reusable.
