/**
 * Admin Customers query keys.
 */
export const ADMIN_CUSTOMERS_QK: readonly ["admin", "customers"] = ["admin", "customers"] as const
export const ADMIN_CUSTOMERS_SEARCH_QK = (
  query: string,
): readonly ["admin", "customers", "search", string] =>
  ["admin", "customers", "search", query] as const
