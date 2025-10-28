/**
 * Admin Reviews query keys.
 */
export const ADMIN_REVIEWS_QK: readonly ["admin", "reviews"] = ["admin", "reviews"] as const

export const ADMIN_REVIEWS_FILTERED_QK = (
  status: "all" | "Pending" | "Published" | "Rejected",
  productId?: string,
  userId?: string,
): readonly ["admin", "reviews", "list", string, string, string] =>
  ["admin", "reviews", "list", status, productId ?? "", userId ?? ""] as const
