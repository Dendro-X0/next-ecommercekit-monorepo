export const WISHLIST_QK: readonly ["shop", "wishlist"] = ["shop", "wishlist"] as const
export const WISHLIST_HAS_QK = (productId: string): readonly ["shop", "wishlist", "has", string] =>
  ["shop", "wishlist", "has", productId] as const
