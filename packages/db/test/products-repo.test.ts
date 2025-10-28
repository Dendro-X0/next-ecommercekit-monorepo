import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory product row
interface ProductRow {
  id: string
  slug: string
  name: string
  priceCents: number
  currency?: "USD"
  imageUrl?: string | null
  categorySlug?: string | null
  featured?: boolean | null
  media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>> | null
  kind?: "digital" | "physical" | null
  shippingRequired?: boolean | null
  weightGrams?: number | null
  digitalVersion?: string | null
  createdAt: Date | string
}

const state = {
  products: [] as ProductRow[],
}

// Minimal schema table/columns
vi.mock("../src/schema/products", () => ({
  products: {
    _tag: "products",
    id: { _col: "id" },
    slug: { _col: "slug" },
    name: { _col: "name" },
    priceCents: { _col: "priceCents" },
    currency: { _col: "currency" },
    imageUrl: { _col: "imageUrl" },
    categorySlug: { _col: "categorySlug" },
    featured: { _col: "featured" },
    media: { _col: "media" },
    kind: { _col: "kind" },
    shippingRequired: { _col: "shippingRequired" },
    weightGrams: { _col: "weightGrams" },
    digitalVersion: { _col: "digitalVersion" },
    createdAt: { _col: "createdAt" },
  },
}))

// drizzle-orm helpers
type Row = Record<string, unknown>
const COUNT_TOKEN = Symbol("count")
vi.mock("drizzle-orm", () => ({
  eq: (col: { _col: string }, val: unknown) => (row: Row) => row[col._col] === val,
  ilike: (col: { _col: string }, pattern: string) => (row: Row) => {
    const value = String(row[col._col] ?? "").toLowerCase()
    const needle = pattern.replace(/%/g, "").toLowerCase()
    return value.includes(needle)
  },
  and:
    (...preds: Array<(r: Row) => boolean>) =>
    (row: Row) =>
      preds.every((p) => p(row)),
  asc: (col: { _col: string }) => ({ dir: "asc" as const, col }),
  desc: (col: { _col: string }) => ({ dir: "desc" as const, col }),
  count: () => COUNT_TOKEN,
}))

function rowsFor(table: { _tag: string }): Row[] {
  if (table._tag === "products") return state.products as unknown as Row[]
  return []
}

function applyOrder(
  rows: Row[],
  order: { dir: "asc" | "desc"; col: { _col: string } } | undefined,
): Row[] {
  if (!order) return rows.slice()
  const out = rows.slice().sort((a, b) => {
    const av = a[order.col._col] as number | string | Date | undefined
    const bv = b[order.col._col] as number | string | Date | undefined
    if (av === bv) return 0
    if (av === undefined) return 1
    if (bv === undefined) return -1
    if (av < (bv as any)) return order.dir === "asc" ? -1 : 1
    return order.dir === "asc" ? 1 : -1
  })
  return out
}

// db mock
vi.mock("../src/db", () => {
  function qb(table: { _tag: string }, projection?: Record<string, any> | undefined) {
    const base = rowsFor(table)
    const projectedAll = projectRows(base, projection)
    const chain: any = projectedAll
    chain.where = (pred?: (r: Row) => boolean) => {
      const filtered = pred ? base.filter(pred) : base.slice()
      const arr = projectRows(filtered, projection) as any
      arr.orderBy = (order?: { dir: "asc" | "desc"; col: { _col: string } }) => {
        const ordered = applyOrder(filtered, order)
        const arr2 = projectRows(ordered, projection) as any
        arr2.limit = (n: number) => {
          const limited = projectRows(ordered.slice(0, n), projection) as any
          limited.offset = (off: number) => projectRows(ordered.slice(off, off + n), projection)
          return limited
        }
        arr2.offset = (off: number) => projectRows(ordered.slice(off), projection)
        return arr2
      }
      arr.limit = (n: number) => projectRows(filtered.slice(0, n), projection)
      arr.offset = (off: number) => projectRows(filtered.slice(off), projection)
      return arr
    }
    chain.orderBy = (order?: { dir: "asc" | "desc"; col: { _col: string } }) => {
      const ordered = applyOrder(base, order)
      const arr = projectRows(ordered, projection) as any
      arr.limit = (n: number) => {
        const limited = projectRows(ordered.slice(0, n), projection) as any
        limited.offset = (off: number) => projectRows(ordered.slice(off, off + n), projection)
        return limited
      }
      arr.offset = (off: number) => projectRows(ordered.slice(off), projection)
      return arr
    }
    chain.limit = (n: number) => projectRows(base.slice(0, n), projection)
    chain.offset = (off: number) => projectRows(base.slice(off), projection)
    return chain
  }

  function projectRows(rows: Row[], projection?: Record<string, any>): Row[] {
    if (!projection) return rows
    const keys = Object.keys(projection)
    // Handle count()
    if (keys.length === 1 && projection[keys[0]] === COUNT_TOKEN) {
      return [{ [keys[0]]: rows.length }]
    }
    // Column mapping projection
    return rows.map((r) => {
      const o: Row = {}
      for (const k of keys) {
        const col = projection[k]
        if (col && typeof col === "object" && "_col" in col)
          o[k] = r[(col as { _col: string })._col]
        else o[k] = (r as any)[k]
      }
      return o
    })
  }

  const db = {
    select(projection?: Record<string, any>) {
      return {
        from(table: { _tag: string }) {
          return qb(table, projection)
        },
      }
    },
    insert(table: { _tag: string }) {
      return {
        values(vals: Row | Row[]) {
          const arr = Array.isArray(vals) ? vals : [vals]
          for (const v of arr) {
            state.products.push(v as unknown as ProductRow)
          }
          return { returning: async () => arr }
        },
      }
    },
    update(table: { _tag: string }) {
      return {
        set(setVals: Record<string, unknown>) {
          return {
            where(pred: (r: Row) => boolean) {
              const updated: Row[] = []
              for (let i = 0; i < state.products.length; i++) {
                const r = state.products[i] as unknown as Row
                if (!pred(r)) continue
                const next: Row = { ...r, ...setVals }
                state.products[i] = next as unknown as ProductRow
                updated.push(next)
              }
              return { returning: async () => updated }
            },
          }
        },
      }
    },
    delete(table: { _tag: string }) {
      return {
        where(pred: (r: Row) => boolean) {
          const before = state.products.length
          const kept = state.products.filter((r) => !pred(r as unknown as Row))
          const removed = state.products.filter((r) => pred(r as unknown as Row))
          state.products = kept
          return { returning: async (_proj?: unknown) => removed.map((r) => ({ id: r.id })) }
        },
      }
    },
  }
  return { db }
})

// Import after mocks
import productsRepo from "../src/repositories/products-repo"

function resetState(): void {
  state.products = []
}

function seed(): void {
  const base = new Date("2025-01-01T00:00:00Z")
  state.products.push(
    {
      id: "p1",
      slug: "alpha",
      name: "Alpha",
      priceCents: 1000,
      currency: "USD",
      categorySlug: "cat-a",
      featured: true,
      createdAt: new Date(base.getTime() + 1000),
    },
    {
      id: "p2",
      slug: "beta",
      name: "Beta",
      priceCents: 500,
      currency: "USD",
      categorySlug: "cat-b",
      featured: false,
      createdAt: new Date(base.getTime() + 2000),
    },
    {
      id: "p3",
      slug: "gamma",
      name: "Gamma",
      priceCents: 1500,
      currency: "USD",
      categorySlug: "cat-a",
      featured: true,
      createdAt: new Date(base.getTime() + 3000),
    },
  )
}

describe("products-repo", () => {
  beforeEach(() => {
    resetState()
    seed()
  })

  it("list supports query, category, sort and pagination", async () => {
    const res1 = await productsRepo.list({ query: "a", page: 1, pageSize: 2 })
    expect(res1.total).toBe(3)
    expect(res1.items.length).toBe(2)
    // default sort newest -> p3 then p2
    expect(res1.items[0].slug).toBe("gamma")

    const res2 = await productsRepo.list({
      category: "cat-a",
      sort: "price_asc",
      page: 1,
      pageSize: 10,
    })
    expect(res2.items.map((p) => p.slug)).toEqual(["alpha", "gamma"])

    const res3 = await productsRepo.list({ sort: "price_desc", page: 1, pageSize: 2 })
    expect(res3.items.map((p) => p.slug)).toEqual(["gamma", "alpha"])
  })

  it("bySlug returns a product and listFeatured limits", async () => {
    const p = await productsRepo.bySlug("alpha")
    expect(p?.slug).toBe("alpha")
    const featured = await productsRepo.listFeatured(1)
    expect(featured.length).toBe(1)
    expect(featured[0].featured).toBe(true)
  })

  it("create, update and remove work; counts and latestCreatedAt reflect changes", async () => {
    const created = await productsRepo.create({
      slug: "delta",
      name: "Delta",
      priceCents: 750,
      currency: "USD",
      featured: false,
    })
    expect(created.slug).toBe("delta")

    const updated = await productsRepo.update(created.id, { priceCents: 800, featured: true })
    expect(updated?.price).toBe(800)
    expect(updated?.featured).toBe(true)

    const total = await productsRepo.countAll()
    expect(total).toBe(4)
    const featCount = await productsRepo.countFeatured()
    expect(featCount).toBeGreaterThanOrEqual(2)

    const latest = await productsRepo.latestCreatedAt()
    expect(typeof latest === "string").toBe(true)

    const removed = await productsRepo.remove(created.id)
    expect(removed).toBe(true)
    const after = await productsRepo.countAll()
    expect(after).toBe(3)
  })
})
