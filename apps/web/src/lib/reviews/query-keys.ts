export const REVIEWS_QK: readonly ["dashboard", "reviews"] = ["dashboard", "reviews"] as const
export const PRODUCT_REVIEWS_QK = (
  productId: string,
): readonly ["shop", "reviews", "product", string] =>
  ["shop", "reviews", "product", productId] as const
