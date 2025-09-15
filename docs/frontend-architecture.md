# Frontend Architecture

The web app (`apps/web`) follows a modular structure.

```
apps/web/
  modules/
    shared/
      components/
      hooks/
      lib/
    ui/
      components/        # App shims built on @repo/ui and Radix
        button.tsx       # maps legacy asChild -> polymorphic `as`
        dialog.tsx       # re-exports Dialog parts from @repo/ui
        popover.tsx      # re-exports Popover parts from @repo/ui
        tooltip.tsx      # re-exports Tooltip parts from @repo/ui
      ...
    marketing/
      home/
      contact/
    shop/
      components/
        product/
        cart/
        checkout/
    account/
      components/
        user/
        user-account/
        auth/
```

## Import Rules
- Do not import Radix directly in app code (`@radix-ui/*`). Prefer:
  - App shims under `@/components/ui/*` (e.g., `@/components/ui/dialog`).
  - Or shared primitives from `@repo/ui/*` when appropriate.
- The `modules/ui/components/*` shims may import Radix directly (allowed override).
- Avoid using `asChild` directly in app code; shims provide safer composition.

## TypeScript & Paths
- `apps/web/tsconfig.json` maps `@/components/*` and `@components/*` to `modules/*`.
- `@repo/ui/*` is mapped to `packages/ui/src/*` for full type safety in-app.

## Composition Safeguards
- The `Button` shim preserves legacy `asChild` by mapping it to a polymorphic `as` prop and merges className safely.
- Dev-only warnings surface if `asChild` receives multiple children or a Fragment, helping prevent `React.Children.only` errors.

### Button defaults
- The app `Button` shim sets `type="button"` by default to prevent accidental form submission. For submit buttons inside forms, pass `type="submit"` explicitly.

### Auth Client Helpers
- Use the centralized helpers in `apps/web/src/lib/auth-client-helpers.ts` for all auth calls (sign in via email/username, magic link, sign up, profile updates, TOTP 2FA, backup codes). This avoids scattered casts and ensures consistent typings.

### Accessibility & IDs
- Avoid static `id` strings that can repeat across component instances. Use React’s `useId()` to generate stable, unique IDs and pair them with `htmlFor`/`aria-describedby` as needed.
- Prefer semantic elements over ARIA roles when possible (e.g., use `<button>` instead of clickable `<div>`, use `<output>` for status messages instead of `<p role="status">`).

## Maintenance Scripts
```bash
# List any direct Radix imports in app code
pnpm --filter web run report:radix-imports

# Preview Radix -> shim import replacements (no changes)
pnpm --filter web run codemod:radix-to-shims:dry

# Apply Radix -> shim import replacements
pnpm --filter web run codemod:radix-to-shims
```
