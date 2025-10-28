import { neon } from "@neondatabase/serverless"
import { config as dotenvConfig } from "dotenv"

// Load env from web app first (shared env strategy), then fallback to local .env
dotenvConfig({ path: "../../apps/web/.env.local" })
dotenvConfig()

async function ensureTables(sql) {
  const required = ["affiliate_profiles", "affiliate_clicks", "affiliate_conversions"]
  for (const tbl of required) {
    const res = await sql`select to_regclass('public.${sql.unsafe(tbl)}') as tbl`
    if (!res?.[0]?.tbl) {
      console.error(
        `[seed:affiliate] Table '${tbl}' does not exist. Run migrations first (pnpm --filter @repo/db db:generate && pnpm --filter @repo/db db:migrate).`,
      )
      process.exit(1)
    }
  }
}

function nowIso() {
  return new Date().toISOString()
}

async function upsertProfiles(sql) {
  const profiles = [
    { id: "aff-prof-1", userId: "u-alice", code: "alice" },
    { id: "aff-prof-2", userId: "u-bob", code: "bob" },
  ]
  const count = await sql`select count(*)::int as count from affiliate_profiles`
  if (Number(count?.[0]?.count ?? 0) === 0) {
    for (const p of profiles) {
      await sql`insert into affiliate_profiles (id, user_id, code, created_at, updated_at) values (${p.id}, ${p.userId}, ${p.code}, ${nowIso()}, ${nowIso()})`
    }
    console.log(`[seed:affiliate] Inserted ${profiles.length} profiles.`)
  } else {
    console.log(`[seed:affiliate] Profiles already present. Skipping.`)
  }
}

async function seedClicks(sql) {
  const clicks = [
    {
      id: "aff-click-1",
      code: "alice",
      userId: "u-guest-1",
      ipHash: "ip1",
      uaHash: "ua1",
      source: "homepage",
    },
    {
      id: "aff-click-2",
      code: "alice",
      userId: null,
      ipHash: "ip2",
      uaHash: "ua2",
      source: "product",
    },
    {
      id: "aff-click-3",
      code: "bob",
      userId: "u-guest-2",
      ipHash: "ip3",
      uaHash: "ua3",
      source: "campaign:social",
    },
  ]
  const count = await sql`select count(*)::int as count from affiliate_clicks`
  if (Number(count?.[0]?.count ?? 0) === 0) {
    for (const c of clicks) {
      await sql`insert into affiliate_clicks (id, code, user_id, ip_hash, ua_hash, source, created_at) values (${c.id}, ${c.code}, ${c.userId}, ${c.ipHash}, ${c.uaHash}, ${c.source}, ${nowIso()})`
    }
    console.log(`[seed:affiliate] Inserted ${clicks.length} clicks.`)
  } else {
    console.log(`[seed:affiliate] Clicks already present. Skipping.`)
  }
}

async function seedConversions(sql) {
  const conversions = [
    {
      id: "aff-cv-1",
      clickId: "aff-click-1",
      orderId: "o-seed-001",
      userId: "u-order-1",
      code: "alice",
      commissionCents: 500,
      status: "pending",
      paidAt: null,
    },
    {
      id: "aff-cv-2",
      clickId: "aff-click-2",
      orderId: "o-seed-002",
      userId: "u-order-2",
      code: "alice",
      commissionCents: 800,
      status: "approved",
      paidAt: null,
    },
    {
      id: "aff-cv-3",
      clickId: "aff-click-3",
      orderId: "o-seed-003",
      userId: "u-order-3",
      code: "bob",
      commissionCents: 1200,
      status: "paid",
      paidAt: nowIso(),
    },
  ]
  const count = await sql`select count(*)::int as count from affiliate_conversions`
  if (Number(count?.[0]?.count ?? 0) === 0) {
    for (const cv of conversions) {
      await sql`insert into affiliate_conversions (id, click_id, order_id, user_id, code, commission_cents, status, created_at, paid_at) values (${cv.id}, ${cv.clickId}, ${cv.orderId}, ${cv.userId}, ${cv.code}, ${cv.commissionCents}, ${cv.status}, ${nowIso()}, ${cv.paidAt})`
    }
    // Mark clicks that converted
    await sql`update affiliate_clicks set converted_at = ${nowIso()} where id in ('aff-click-1','aff-click-2','aff-click-3')`
    console.log(`[seed:affiliate] Inserted ${conversions.length} conversions.`)
  } else {
    console.log(`[seed:affiliate] Conversions already present. Skipping.`)
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error(
      "[seed:affiliate] DATABASE_URL is missing. Create apps/web/.env.local with DATABASE_URL or export it in your shell.",
    )
    process.exit(1)
  }
  const sql = neon(url)

  await ensureTables(sql)
  await upsertProfiles(sql)
  await seedClicks(sql)
  await seedConversions(sql)

  console.log("[seed:affiliate] Done.")
}

main().catch((e) => {
  console.error("[seed:affiliate] Unexpected error:", e)
  process.exit(1)
})
