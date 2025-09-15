/**
 * Safe-mode switches for UI gating.
 * One export per file.
 */
export const productsDisabled: boolean =
  (process.env.NEXT_PUBLIC_DISABLE_DATA_FETCH ?? "false").toLowerCase() === "true" ||
  (process.env.NEXT_PUBLIC_DISABLE_PRODUCTS ?? "false").toLowerCase() === "true"

/**
 * Disable animations (e.g., motion/react) for safer hydration in dev.
 */
const RAW_DISABLE_ANIM: string | undefined = process.env.NEXT_PUBLIC_DISABLE_ANIMATIONS
const RAW_ENV: string = process.env.NODE_ENV ?? "development"
export const animationsDisabled: boolean =
  RAW_DISABLE_ANIM !== undefined
    ? RAW_DISABLE_ANIM.toLowerCase() === "true"
    : RAW_ENV !== "production"

/**
 * Render the minimal boot without heavy providers to isolate crashes.
 * Defaults to true in development if not explicitly set.
 */
const RAW_MIN_BOOT: string | undefined = process.env.NEXT_PUBLIC_BOOT_MINIMAL
// In production, minimal boot is always disabled regardless of the env flag.
export const minimalBoot: boolean =
  RAW_ENV === "production"
    ? false
    : RAW_MIN_BOOT !== undefined
      ? RAW_MIN_BOOT.toLowerCase() === "true"
      : true

/**
 * Prefer rendering local UI templates (no API/data fetching) when true.
 * This helps isolate freezes by removing network/data dependencies.
 */
const RAW_UI_TEMPLATES: string | undefined = process.env.NEXT_PUBLIC_USE_UI_TEMPLATES
export const uiTemplates: boolean = RAW_UI_TEMPLATES?.toLowerCase() === "true"
