# Frontend Components Inventory

Legend: Completed = implemented and stable UI; Baseline = present and functional but may need polish; WIP = known gaps; Stubbed = UI exists, backend disabled in dev.

- Marketing / Home (`apps/web/modules/marketing/home/`)
  - HeroSection — Completed
  - HeroCarousel — Completed
  - FeaturedProducts — Completed
  - TopSelling — Completed
  - BrowseCategories — WIP (uses `BentoCard` with placeholder props)
  - CustomerTestimonials — Completed (heavy; consider lazy-load)
  - NewsletterSignup — Completed

- Shop / Product (`apps/web/modules/shop/components/product/`)
  - product-grid — Completed (mobile improvements)
  - product-card — Completed (mobile Add to Cart)
  - product-filters — Completed (responsive header, scrollable categories)
  - related-products — Completed
  - mobile-pdp-bar — Completed (sticky on mobile)
  - product-faq — Baseline

- Shop / Cart (`apps/web/modules/shop/components/cart/`)
  - cart-drawer — Completed (stacked CTAs on small screens)
  - cart-item — Completed
  - cart-summary — Completed (sticky on desktop)
  - mobile-checkout-bar — Completed (sticky on mobile)

- Shop / Checkout (`apps/web/modules/shop/components/checkout/`)
  - shipping-form — Baseline
  - payment-form — Baseline
  - order-summary — Baseline

- Account / User (`apps/web/modules/account/components/user/`)
  - profile-form — Completed (avatar size/upload, email verification UI)
  - password-form — Baseline
  - notification-settings — Baseline
  - trusted-devices — Baseline
  - two-factor-settings — Baseline

- Account / User Account (`apps/web/modules/account/components/user-account/`)
  - profile-settings — Baseline
  - address-settings — Baseline
  - security-settings — Baseline
  - order-history — Baseline
  - profile-form — Baseline

- Account / Auth (`apps/web/modules/account/components/auth/`)
  - login-form — Completed (Better Auth email/password; role-based redirect; session refresh)
  - signup-form — Completed (redirects to verify-email with prefilled email)
  - reset-password-form — Baseline (UI present; server actions + emails pending)
  - forgot-password-form — Baseline (UI present; server actions + emails pending)
  - two-factor-form — Baseline (plugin wired; challenge/recovery flows to polish)
  - social-login — Baseline (UI wired; configure OAuth to enable)
  - auth-card — Completed (UI shell)
  - submit-button — Completed
  - field-message — Completed
  - form-message — Completed

- Shared Components (`apps/web/modules/shared/components/`)
  - header — Completed
  - footer — Completed
  - navigation-dropdown — Completed
  - theme-provider — Completed
  - theme-toggle — Completed
  - guards/require-auth — Stubbed (no backend in dev)
  - guards/require-role — Stubbed (no backend in dev)
  - emails/magic-link-email — Baseline
  - emails/verification-code-email — Baseline

- UI Primitives (Shims) (`apps/web/modules/ui/components/`)
  - 55+ components (e.g., button, card, input, select, table, tabs, accordion, drawer, dialog, sheet, sidebar, pagination, page-header, section, skeletons, star-rating, etc.) — Completed and used across the app.
