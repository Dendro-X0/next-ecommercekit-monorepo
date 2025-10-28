/**
 * Admin Affiliate query keys.
 */
export const ADMIN_AFFILIATE_CONVERSIONS_QK: readonly ["admin", "affiliate", "conversions"] = [
  "admin",
  "affiliate",
  "conversions",
] as const
export const ADMIN_AFFILIATE_CONVERSIONS_FILTERED_QK = (
  status: "all" | "pending" | "approved" | "paid",
): readonly ["admin", "affiliate", "conversions", string] =>
  ["admin", "affiliate", "conversions", status] as const
