export const ADMIN_ORDERS_QK: readonly ["admin", "orders"] = ["admin", "orders"] as const
export const ADMIN_ORDER_BY_ID_QK = (id: string): readonly ["admin", "orders", string] =>
  ["admin", "orders", id] as const
