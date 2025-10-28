export const ORDERS_QK: readonly ["shop", "orders"] = ["shop", "orders"] as const
export const ORDER_BY_ID_QK = (id: string): readonly ["shop", "orders", string] =>
  ["shop", "orders", id] as const
