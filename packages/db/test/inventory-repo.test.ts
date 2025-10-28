import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory mock state
interface InventoryRow {
  productId: string
  stockQty: number
  updatedAt: Date
}
interface ReservationRow {
  id: string
  orderId: string
  productId: string
  qty: number
  status: string
  createdAt: Date
  updatedAt: Date
}

const state = {
  inventory: new Map<string, InventoryRow>(),
  reservations: [] as ReservationRow[],
}

// Minimal columns/tables
const tables = {
  inventory: {
    _tag: "inventory",
    productId: { _col: "productId" },
    stockQty: { _col: "stockQty" },
    updatedAt: { _col: "updatedAt" },
  },
  inventoryReservations: {
    _tag: "inventoryReservations",
    id: { _col: "id" },
    orderId: { _col: "orderId" },
    productId: { _col: "productId" },
    qty: { _col: "qty" },
    status: { _col: "status" },
    createdAt: { _col: "createdAt" },
    updatedAt: { _col: "updatedAt" },
  },
} as const

type Row = Record<string, unknown>

// Helpers to fetch collections per table tag
function rowsFor(table: { _tag: string }): Row[] {
  if (table._tag === "inventory")
    return Array.from(state.inventory.values()).map((r) => r as unknown as Row)
  if (table._tag === "inventoryReservations") return state.reservations as unknown as Row[]
  return []
}

function setRow(table: { _tag: string }, row: Row): void {
  if (table._tag === "inventory") {
    const r = row as unknown as InventoryRow
    state.inventory.set(r.productId, r)
    return
  }
  if (table._tag === "inventoryReservations") {
    state.reservations.push(row as unknown as ReservationRow)
  }
}

vi.mock("../src/schema/inventory", () => ({
  inventory: {
    _tag: "inventory",
    productId: { _col: "productId" },
    stockQty: { _col: "stockQty" },
    updatedAt: { _col: "updatedAt" },
  },
}))
vi.mock("../src/schema/inventory-reservations", () => ({
  inventoryReservations: {
    _tag: "inventoryReservations",
    id: { _col: "id" },
    orderId: { _col: "orderId" },
    productId: { _col: "productId" },
    qty: { _col: "qty" },
    status: { _col: "status" },
    createdAt: { _col: "createdAt" },
    updatedAt: { _col: "updatedAt" },
  },
}))

// Mock drizzle-orm operators
vi.mock("drizzle-orm", () => ({
  and:
    (...preds: Array<(r: Row) => boolean>) =>
    (row: Row) =>
      preds.every((p) => p(row)),
  eq: (col: { _col: string }, val: unknown) => (row: Row) => row[col._col] === val,
  gte: (col: { _col: string }, val: number) => (row: Row) => (row[col._col] as number) >= val,
  sql: (strings: TemplateStringsArray, ...exprs: unknown[]) => {
    // Supports: sql`${inventory.stockQty} - ${n}` and sql`${inventory.stockQty} + ${n}`
    const left = exprs[0] as { _col: string }
    const op = strings[1].trim()
    const right = exprs[1] as number
    if (op.startsWith("-"))
      return { _apply: (row: Row) => (row[left._col] as number) - right } as const
    if (op.startsWith("+"))
      return { _apply: (row: Row) => (row[left._col] as number) + right } as const
    return { _apply: (row: Row) => row[left._col] } as const
  },
}))

// Mock db with transaction/select/insert/update
vi.mock("../src/db", () => {
  function makeOps() {
    return {
      select() {
        return {
          from(table: { _tag: string }) {
            return {
              where(pred: (r: Row) => boolean) {
                const filtered = rowsFor(table).filter(pred)
                ;(filtered as unknown as { limit: (n: number) => Row[] }).limit = (_n: number) =>
                  filtered
                return filtered
              },
              limit(_n: number) {
                return rowsFor(table)
              },
            }
          },
        }
      },
      insert(table: { _tag: string }) {
        return {
          values(vals: Row | Row[]) {
            const arr = Array.isArray(vals) ? vals : [vals]
            for (const r of arr) setRow(table, { ...r })
            return { returning: async () => arr }
          },
        }
      },
      update(table: { _tag: string }) {
        return {
          set(setVals: Record<string, unknown>) {
            return {
              where(pred: (r: Row) => boolean) {
                const source = rowsFor(table)
                const updated: Row[] = []
                for (let i = 0; i < source.length; i++) {
                  const r = source[i]
                  if (!pred(r)) continue
                  const next: Row = { ...r }
                  for (const [k, v] of Object.entries(setVals)) {
                    const val = (v as { _apply?: (row: Row) => unknown })._apply
                      ? (v as { _apply: (row: Row) => unknown })._apply(r)
                      : v
                    ;(next as Record<string, unknown>)[k] = val
                  }
                  // persist
                  if (table._tag === "inventory") {
                    setRow(table, next)
                  } else if (table._tag === "inventoryReservations") {
                    const idx = state.reservations.findIndex(
                      (x) => x.id === (r as unknown as ReservationRow).id,
                    )
                    if (idx >= 0) state.reservations[idx] = next as unknown as ReservationRow
                  }
                  updated.push(next)
                }
                return { returning: async () => updated }
              },
            }
          },
        }
      },
    }
  }
  const db = {
    ...makeOps(),
    async transaction<T>(fn: (tx: ReturnType<typeof makeOps>) => Promise<T> | T): Promise<T> {
      const tx = makeOps()
      const result = await fn(tx)
      return result
    },
  }
  return { db }
})

// Import after mocks
import inventoryRepo from "../src/repositories/inventory-repo"

function resetState(): void {
  state.inventory.clear()
  state.reservations = []
}

describe("inventory-repo", () => {
  beforeEach(() => resetState())

  it("getStock returns 0 when missing and reflects setStock", async () => {
    expect(await inventoryRepo.getStock("p1")).toBe(0)
    await inventoryRepo.setStock("p1", 5)
    expect(await inventoryRepo.getStock("p1")).toBe(5)
    await inventoryRepo.setStock("p1", 0)
    expect(await inventoryRepo.getStock("p1")).toBe(0)
  })

  it("reserveForOrder decrements stock and creates reservations; out of stock throws", async () => {
    // Only p1 tracked; p2 is untracked and should be skipped
    await inventoryRepo.setStock("p1", 5)
    await inventoryRepo.reserveForOrder("o1", [
      { productId: "p1", qty: 3 },
      { productId: "p2", qty: 10 },
    ])
    expect(await inventoryRepo.getStock("p1")).toBe(2)
    const res = await inventoryRepo.listReservationsByOrder("o1")
    expect(res.length).toBe(1)
    expect(res[0]).toMatchObject({ productId: "p1", qty: 3, status: "reserved" })

    // Out of stock path
    await expect(
      inventoryRepo.reserveForOrder("o2", [{ productId: "p1", qty: 5 }]),
    ).rejects.toThrowError(/OUT_OF_STOCK:p1/)
  })

  it("releaseOrder restores reserved stock and marks released", async () => {
    await inventoryRepo.setStock("p1", 4)
    await inventoryRepo.reserveForOrder("o1", [{ productId: "p1", qty: 3 }])
    await inventoryRepo.releaseOrder("o1")
    expect(await inventoryRepo.getStock("p1")).toBe(4)
    const res = await inventoryRepo.listReservationsByOrder("o1")
    expect(res[0].status).toBe("released")
  })

  it("commitOrder marks committed, restockOrder adds back regardless of prior status", async () => {
    await inventoryRepo.setStock("p1", 10)
    await inventoryRepo.reserveForOrder("o1", [{ productId: "p1", qty: 6 }])
    await inventoryRepo.commitOrder("o1")
    const afterCommit = await inventoryRepo.listReservationsByOrder("o1")
    expect(afterCommit[0].status).toBe("committed")
    // Now restock (e.g., refund) should add back qty
    await inventoryRepo.restockOrder("o1")
    expect(await inventoryRepo.getStock("p1")).toBe(10)
    const afterRestock = await inventoryRepo.listReservationsByOrder("o1")
    expect(afterRestock[0].status).toBe("released")
  })
})
