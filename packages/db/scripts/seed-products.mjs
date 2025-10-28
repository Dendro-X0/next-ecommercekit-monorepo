import { neon } from "@neondatabase/serverless"
import { config as dotenvConfig } from "dotenv"

// Load env from web app first (unified env strategy), then fallback to local .env
dotenvConfig({ path: "../../apps/web/.env.local" })
dotenvConfig()

/**
 * Simple products seed using Neon + plain SQL to avoid TS runtime deps.
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error(
      "[seed] DATABASE_URL is missing. Create apps/web/.env.local with DATABASE_URL or export it in your shell.",
    )
    process.exit(1)
  }
  const sql = neon(url)

  // Ensure table exists (will no-op if migrations already created it)
  // If table doesn't exist, fail fast to avoid masking migration issues.
  try {
    const productsExists = await sql`select to_regclass('public.products') as tbl`
    const categoriesExists = await sql`select to_regclass('public.categories') as tbl`
    if (!productsExists?.[0]?.tbl) {
      console.error(
        "[seed] Table 'products' does not exist. Run migrations first (pnpm --filter @repo/db db:generate && pnpm --filter @repo/db db:migrate).",
      )
      process.exit(1)
    }
    if (!categoriesExists?.[0]?.tbl) {
      console.error(
        "[seed] Table 'categories' does not exist. Run migrations first (pnpm --filter @repo/db db:generate && pnpm --filter @repo/db db:migrate).",
      )
      process.exit(1)
    }
  } catch (e) {
    console.error("[seed] Failed checking table existence:", e)
    process.exit(1)
  }

  // Count current products (used to decide whether to insert products; categories will still seed if missing)
  const countRows = await sql`select count(*)::int as count from products`
  const current = Number(countRows?.[0]?.count ?? 0)

  const categories = [
    {
      id: "c-apparel",
      slug: "apparel",
      name: "Apparel",
      imageUrl: "/categories/apparel.jpg",
    },
    {
      id: "c-footwear",
      slug: "footwear",
      name: "Footwear",
      imageUrl: "/categories/footwear.jpg",
    },
    {
      id: "c-electronics",
      slug: "electronics",
      name: "Electronics",
      imageUrl: "/categories/electronics.jpg",
    },
    {
      id: "c-home",
      slug: "home",
      name: "Home",
      imageUrl: "/categories/home.jpg",
    },
    {
      id: "c-stationery",
      slug: "stationery",
      name: "Stationery",
      imageUrl: "/categories/stationery.jpg",
    },
    {
      id: "c-grocery",
      slug: "grocery",
      name: "Grocery",
      imageUrl: "/categories/grocery.jpg",
    },
    {
      id: "c-outdoors",
      slug: "outdoors",
      name: "Outdoors",
      imageUrl: "/categories/outdoors.jpg",
    },
    {
      id: "c-fitness",
      slug: "fitness",
      name: "Fitness",
      imageUrl: "/categories/fitness.jpg",
    },
    // Digital product categories
    {
      id: "c-ebooks",
      slug: "e-books",
      name: "E‑Books",
      imageUrl: "/categories/ebooks.jpg",
    },
    {
      id: "c-software",
      slug: "software",
      name: "Software",
      imageUrl: "/categories/software.jpg",
    },
    {
      id: "c-audio",
      slug: "audio",
      name: "Audio",
      imageUrl: "/categories/audio.jpg",
    },
    {
      id: "c-images",
      slug: "images",
      name: "Images",
      imageUrl: "/categories/images.jpg",
    },
    {
      id: "c-other",
      slug: "other",
      name: "Other",
      imageUrl: "/categories/other.jpg",
    },
  ]

  // Migrate legacy slug before upsert to avoid unique conflicts
  // 1) Retarget products that referenced the old slug
  await sql`update products set category_slug = 'software' where category_slug = 'codebases'`
  // 2) Drop the legacy category row so upsert for 'software' is unambiguous
  await sql`delete from categories where slug = 'codebases'`

  // Upsert categories (ensures new categories are added even if table already has data)
  const insertedCats = 0
  for (const c of categories) {
    await sql`
      insert into categories (id, slug, name, image_url)
      values (${c.id}, ${c.slug}, ${c.name}, ${c.imageUrl})
      on conflict (slug) do update set
        name = excluded.name,
        image_url = excluded.image_url
    `
  }
  console.log(`[seed] Ensured ${categories.length} categories exist (idempotent upsert).`)

  const products = [
    {
      id: "p-001",
      slug: "classic-t-shirt",
      name: "Classic T‑Shirt",
      priceCents: 1999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p001/640/640",
      categorySlug: "apparel",
    },
    {
      id: "p-002",
      slug: "premium-hoodie",
      name: "Premium Hoodie",
      priceCents: 4999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p002/640/640",
      categorySlug: "apparel",
    },
    {
      id: "p-003",
      slug: "sneaker-low",
      name: "Sneaker Low",
      priceCents: 7999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p003/640/640",
      categorySlug: "footwear",
    },
    {
      id: "p-004",
      slug: "sneaker-high",
      name: "Sneaker High",
      priceCents: 8999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p004/640/640",
      categorySlug: "footwear",
    },
    {
      id: "p-005",
      slug: "wireless-earbuds",
      name: "Wireless Earbuds",
      priceCents: 5999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p005/640/640",
      categorySlug: "electronics",
    },
    {
      id: "p-006",
      slug: "smart-watch",
      name: "Smart Watch",
      priceCents: 12999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p006/640/640",
      categorySlug: "electronics",
    },
    {
      id: "p-007",
      slug: "desk-lamp",
      name: "LED Desk Lamp",
      priceCents: 3499,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p007/640/640",
      categorySlug: "home",
    },
    {
      id: "p-008",
      slug: "notebook-set",
      name: "Notebook Set (3)",
      priceCents: 1499,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p008/640/640",
      categorySlug: "stationery",
    },
    {
      id: "p-009",
      slug: "coffee-beans",
      name: "Coffee Beans 1kg",
      priceCents: 1599,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p009/640/640",
      categorySlug: "grocery",
    },
    {
      id: "p-010",
      slug: "water-bottle",
      name: "Insulated Water Bottle",
      priceCents: 2499,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p010/640/640",
      categorySlug: "outdoors",
    },
    {
      id: "p-011",
      slug: "yoga-mat",
      name: "Yoga Mat",
      priceCents: 2999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p011/640/640",
      categorySlug: "fitness",
    },
    {
      id: "p-012",
      slug: "travel-backpack",
      name: "Travel Backpack",
      priceCents: 6999,
      currency: "USD",
      imageUrl: "https://picsum.photos/seed/p012/640/640",
      categorySlug: "outdoors",
    },
  ]

  // Mark some as featured
  const featuredSet = new Set(["p-002", "p-005", "p-006", "p-012"])

  if (current === 0) {
    for (const p of products) {
      const isFeatured = featuredSet.has(p.id)
      await sql`insert into products (id, slug, name, price_cents, currency, image_url, category_slug, featured) values (${p.id}, ${p.slug}, ${p.name}, ${p.priceCents}, ${p.currency}, ${p.imageUrl}, ${p.categorySlug}, ${isFeatured})`
    }
  } else {
    console.log(`[seed] Products already present (${current}). Skipping products insert.`)
  }

  // Ensure the seeded PDP slug exists for E2E determinism
  // This is idempotent and will no-op if the product already exists (unique on slug)
  try {
    const ensureId = "p-ct-fixed"
    const ensureSlug = "classic-t-shirt"
    const ensureName = "Classic T‑Shirt"
    const ensurePrice = 1999
    const ensureCurrency = "USD"
    const ensureImage = "https://picsum.photos/seed/p001/640/640"
    const ensureCategory = "apparel"
    await sql`
      insert into products (id, slug, name, price_cents, currency, image_url, category_slug, featured)
      values (${ensureId}, ${ensureSlug}, ${ensureName}, ${ensurePrice}, ${ensureCurrency}, ${ensureImage}, ${ensureCategory}, ${true})
      on conflict (slug) do nothing
    `
    console.log("[seed] Ensured product 'classic-t-shirt' exists.")
  } catch (e) {
    console.warn("[seed] Failed to ensure 'classic-t-shirt':", e)
  }

  const after = await sql`select count(*)::int as count from products`
  console.log(`[seed] Inserted ${Number(after?.[0]?.count ?? 0) - current} products.`)
}

main().catch((e) => {
  console.error("[seed] Unexpected error:", e)
  process.exit(1)
})
