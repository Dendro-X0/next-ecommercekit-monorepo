import type { CreateOrderInput, Order } from "@/types/order"

/**
 * Typed client for Orders API.
 */
export const ordersApi = {
  async create(
    input: CreateOrderInput,
    opts?: Readonly<{ idempotencyKey?: string }>,
  ): Promise<Order> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey
    const res: Response = await fetch("/api/v1/orders", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg: string = `Failed to create order (${res.status})`
      throw new Error(msg)
    }
    return (await res.json()) as Order
  },

  async byId(id: string): Promise<Order> {
    const res: Response = await fetch(`/api/v1/orders/${encodeURIComponent(id)}`, {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) {
      const msg: string = `Failed to fetch order (${res.status})`
      throw new Error(msg)
    }
    return (await res.json()) as Order
  },

  async list(): Promise<readonly Order[]> {
    const res: Response = await fetch(`/api/v1/orders`, {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) {
      const msg: string = `Failed to list orders (${res.status})`
      throw new Error(msg)
    }
    return (await res.json()) as readonly Order[]
  },
} as const
