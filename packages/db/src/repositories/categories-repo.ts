/**
 * Categories repository.
 * One export per file: `categoriesRepo`.
 */
import { count, eq } from "drizzle-orm"
import { db } from "../db"
import { categories } from "../schema/categories"
import { products } from "../schema/products"

export type CategoryDTO = Readonly<{
  id: string
  slug: string
  name: string
  imageUrl?: string
  productCount: number
}>

async function list(): Promise<readonly CategoryDTO[]> {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      imageUrl: categories.imageUrl,
      productCount: count(products.id).as("productCount"),
    })
    .from(categories)
    .leftJoin(products, eq(products.categorySlug, categories.slug))
    .groupBy(categories.id, categories.slug, categories.name, categories.imageUrl)
    .orderBy(categories.name)
  return rows.map(
    (r): CategoryDTO => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      imageUrl: r.imageUrl ?? undefined,
      productCount: Number(r.productCount ?? 0),
    }),
  )
}

async function countAll(): Promise<number> {
  const r = await db.select({ value: count() }).from(categories)
  return Number(r[0]?.value ?? 0)
}

const categoriesRepo = { list, countAll } as const

export default categoriesRepo
