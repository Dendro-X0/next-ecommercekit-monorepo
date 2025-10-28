import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory mock state
type OrderRow = {
  id: string
  status: string
  createdAt: Date | string
  userId: string | null
  guestId: string | null
  email: string | null
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  paymentProvider?: string | null
  paymentRef?: string | null
  affiliateCode?: string | null
  affiliateClickId?: string | null
  affiliateCommissionCents?: number | null
  affiliateStatus?: string | null
  affiliateAttributedAt?: Date | null
}

const state = {
  orders: new Map<string, OrderRow>(),
  orderItems: new Map<
    string,
    {
      id: string
      orderId: string
      productId: string | null
      name: string
      priceCents: number
      quantity: number
      imageUrl: string | null
    }[]
  >(),
}

// Minimal Drizzle-like helpers used by repo
function whereId(id: string) {
  return (row: OrderRow) => row.id === id
}
function wherePaymentRef(ref: string) {
  return (row: OrderRow) => (row.paymentRef ?? null) === ref
}

// Mock ../src/db before importing repo
vi.mock("../src/db", () => {
  const db = {
    async insert(_table: unknown) {
      return {
        values(vals: unknown) {
          const arr = Array.isArray(vals) ? vals : [vals]
          // orders insert
          for (const v of arr as unknown as OrderRow[]) {
            const row: OrderRow = { ...v } as OrderRow
            if (!state.orders.has(row.id)) state.orders.set(row.id, row)
          }
          return { returning: async () => Array.from(state.orders.values()) }
        },
      }
    },
    select() {
      return {
        from(table: unknown) {
          return {
            where(pred: unknown) {
              const p = pred as (r: OrderRow) => boolean
              if ((table as { _tag?: string })._tag === "orderItems") return [] as never
              return Array.from(state.orders.values()).filter(p)
            },
            orderBy() {
              return Array.from(state.orders.values())
            },
            limit(_n: number) {
              return Array.from(state.orders.values())
            },
          }
        },
      }
    },
    update(_table: unknown) {
      return {
        set(setVals: Partial<OrderRow>) {
          return {
            where(pred: unknown) {
              const p = pred as (r: OrderRow) => boolean
              const updated: OrderRow[] = []
              for (const row of state.orders.values()) {
                if (p(row)) {
                  const next = { ...row, ...setVals } as OrderRow
                  state.orders.set(row.id, next)
                  updated.push(next)
                }
              }
              return { returning: async () => updated }
            },
          }
        },
      }
    },
  }
  return { db }
})

// Mock drizzle-orm comparators to predicate functions
vi.mock("drizzle-orm", () => ({
  and:
    (...preds: Array<(r: unknown) => boolean>) =>
    (row: unknown) =>
      preds.every((p) => p(row)),
  or:
    (...preds: Array<(r: unknown) => boolean>) =>
    (row: unknown) =>
      preds.some((p) => p(row)),
  desc: (x: unknown) => x,
  eq: (col: { _col: string }, val: unknown) => (row: Record<string, unknown>) => {
    return row[col._col] === val
  },
}))

// Mock schema columns/tables with minimal shapes used by repo
vi.mock("../src/schema/orders", () => ({
  orders: {
    id: { _col: "id" },
    paymentRef: { _col: "paymentRef" },
    status: { _col: "status" },
    createdAt: { _col: "createdAt" },
    _tag: "orders",
  },
  orderItems: {
    _tag: "orderItems",
    orderId: { _col: "orderId" },
  },
}))

// Import after mocks
import ordersRepo from "../src/repositories/orders-repo"

function resetState(): void {
  state.orders.clear()
  state.orderItems.clear()
}

describe("orders-repo", () => {
  beforeEach(() => resetState())

  it("updateStatusByPaymentRef updates matching order", async () => {
    const createdAt = new Date("2025-01-01T00:00:00Z")
    state.orders.set("o1", {
      id: "o1",
      status: "pending",
      createdAt,
      userId: null,
      guestId: "g1",
      email: "e@x.com",
      subtotalCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
      paymentProvider: "stripe",
      paymentRef: "pi_123",
    })
    state.orders.set("o2", {
      id: "o2",
      status: "pending",
      createdAt,
      userId: null,
      guestId: "g2",
      email: "e2@x.com",
      subtotalCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
      paymentProvider: "stripe",
      paymentRef: "pi_456",
    })

    const res = await ordersRepo.updateStatusByPaymentRef("pi_123", "paid")
    expect(res).not.toBeNull()
    expect(res?.id).toBe("o1")
    expect(res?.status).toBe("paid")
    expect(res?.createdAt instanceof Date).toBe(true)
  })

  it("updateStatusByPaymentRef returns null when not found", async () => {
    const res = await ordersRepo.updateStatusByPaymentRef("pi_missing", "paid")
    expect(res).toBeNull()
  })
})
