import { neon } from "@neondatabase/serverless"
import { config as dotenvConfig } from "dotenv"

// Load env from web app first (unified env strategy), then fallback to local .env
dotenvConfig({ path: "../../apps/web/.env.local" })
dotenvConfig()

/**
 * Seed product reviews with a few sample rows.
 * Uses Neon + plain SQL for zero TS deps at runtime.
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

  // Ensure table exists (fail fast if not)
  try {
    const exists = await sql`select to_regclass('public.reviews') as tbl`
    if (!exists?.[0]?.tbl) {
      console.error(
        "[seed] Table 'reviews' does not exist. Run migrations first (pnpm --filter @repo/db db:generate && pnpm --filter @repo/db db:migrate).",
      )
      process.exit(1)
    }
  } catch (e) {
    console.error("[seed] Failed checking 'reviews' table existence:", e)
    process.exit(1)
  }

  // Count current reviews
  const countRows = await sql`select count(*)::int as count from reviews`
  const current = Number(countRows?.[0]?.count ?? 0)

  // Pick a few product ids to attach reviews to
  const prows = await sql`select id, slug from products order by created_at asc limit 3`
  const productIds = (prows ?? []).map((r) => r.id)
  const p1 = productIds[0] || "p-001"
  const p2 = productIds[1] || productIds[0] || "p-002"
  const p3 = productIds[2] || productIds[1] || productIds[0] || "p-003"

  const reviews = [
    {
      id: "rv-seed-001",
      userId: "u-seed-1",
      productId: p1,
      rating: 5,
      title: "Excellent quality",
      content: "Exceeded expectations. Would buy again!",
      status: "Published",
    },
    {
      id: "rv-seed-002",
      userId: "u-seed-2",
      productId: p2,
      rating: 3,
      title: "Okay",
      content: "Average experience. Could be better.",
      status: "Pending",
    },
    {
      id: "rv-seed-003",
      userId: null,
      productId: p3,
      rating: 1,
      title: "Not satisfied",
      content: "Had issues with the product.",
      status: "Rejected",
    },
  ]

  let inserted = 0
  for (const r of reviews) {
    await sql`
      insert into reviews (id, user_id, product_id, rating, title, content, status)
      values (${r.id}, ${r.userId}, ${r.productId}, ${r.rating}, ${r.title}, ${r.content}, ${r.status})
      on conflict (id) do nothing
    `
    inserted += 1
  }

  const after = await sql`select count(*)::int as count from reviews`
  const delta = Number(after?.[0]?.count ?? 0) - current
  console.log(`[seed] Inserted ${delta} reviews (attempted ${inserted}).`)
}

main().catch((e) => {
  console.error("[seed] Unexpected error:", e)
  process.exit(1)
})
