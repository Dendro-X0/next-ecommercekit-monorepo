import { randomUUID } from "node:crypto"
import { auth } from "@repo/auth"
import { db } from "@repo/db"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import type { Context, Next } from "hono"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { ZodError } from "zod"
import { apiEnv } from "./env"
import { renderEmailMetrics } from "./lib/transactional-email"
import accountAddressesRoute from "./routes/account-addresses"
import accountPreferencesRoute from "./routes/account-preferences"
import accountReviewsRoute from "./routes/account-reviews"
import adminRoute from "./routes/admin"
import adminAffiliateRoute from "./routes/admin-affiliate"
import adminCustomersRoute from "./routes/admin-customers"
import adminReviewsRoute from "./routes/admin-reviews"
import affiliateRoute from "./routes/affiliate"
import cartRoute from "./routes/cart"
import categoriesRoute from "./routes/categories"
import checkoutRoute from "./routes/checkout"
import contactRoute from "./routes/contact"
import ordersRoute from "./routes/orders"
import paymentsPaypalRoute from "./routes/payments-paypal"
import paymentsStripeRoute from "./routes/payments-stripe"
import productsRoute from "./routes/products"
import reviewsRoute from "./routes/reviews"
import testRoute from "./routes/test"
import wishlistRoute from "./routes/wishlist"

/**
 * Hono application mounting Better Auth and exposing session/user context.
 */
export type AppType = typeof app

export const app = new Hono<{
  Variables: {
    readonly user: unknown | null
    readonly session: unknown | null
    readonly reqId: string
    readonly reqStartMs: number
  }
}>()

// Simple in-memory metrics for Prometheus-style scraping
type MetricKey = Readonly<{ method: string; status: number }>
const requestCounters: Map<string, number> = new Map()
function incMetric(method: string, status: number): void {
  const key: string = `${method.toUpperCase()}|${status}`
  requestCounters.set(key, (requestCounters.get(key) ?? 0) + 1)
}
function renderMetrics(): string {
  const lines: string[] = [
    "# HELP requests_total Total HTTP requests",
    "# TYPE requests_total counter",
  ]
  for (const [k, v] of requestCounters.entries()) {
    const [method, status] = k.split("|")
    lines.push(`requests_total{method="${method}",status="${status}"} ${v}`)
  }
  const base: string = `${lines.join("\n")}\n`
  return base + renderEmailMetrics()
}

function getClientIp(c: Context): string {
  const fwd: string | undefined = c.req.header("x-forwarded-for")
  if (fwd && fwd.length > 0) return fwd.split(",")[0]!.trim()
  const rip: string | undefined = c.req.header("x-real-ip")
  if (rip) return rip
  const raw: unknown = c.req.raw as unknown
  const addr: string | undefined = (raw as { socket?: { remoteAddress?: string } }).socket
    ?.remoteAddress
  return addr ?? "unknown"
}

// DB and Redis readiness helpers
const DB_READY_TIMEOUT_MS: number = 1500
let redisClient: Redis | null = null
let ratelimit: Ratelimit | null = null
if (apiEnv.UPSTASH_REDIS_REST_URL && apiEnv.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: apiEnv.UPSTASH_REDIS_REST_URL,
    token: apiEnv.UPSTASH_REDIS_REST_TOKEN,
  })
  ratelimit = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(
      apiEnv.API_RATE_LIMIT_MAX,
      `${apiEnv.API_RATE_LIMIT_WINDOW_MS} ms`,
    ),
    analytics: true,
    prefix: "rl",
  })
}

async function checkDbReady(timeoutMs: number): Promise<boolean> {
  const p = db.execute("select 1 as ok")
  const t = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("db-timeout")), timeoutMs),
  )
  try {
    await Promise.race([p, t])
    return true
  } catch {
    return false
  }
}

async function checkRedisReady(timeoutMs: number): Promise<boolean> {
  if (!redisClient) return true
  const p = redisClient.ping()
  const t = new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("redis-timeout")), timeoutMs),
  )
  try {
    await Promise.race([p, t])
    return true
  } catch {
    return false
  }
}

// CORS for cross-origin apps (credentials allowed)
app.use(
  "*",
  cors({
    origin: apiEnv.WEB_ORIGIN,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
  }),
)

// Correlation ID and request timer
app.use("*", async (c: Context, next: Next) => {
  const existing: string | undefined = c.req.header("x-request-id")
  const reqId: string = existing ?? randomUUID()
  c.set("reqId", reqId)
  c.set("reqStartMs", Date.now())
  const res = await next()
  c.res.headers.set("x-request-id", reqId)
  return res
})

// Global rate limiting: Upstash Redis (prod) or in-memory fallback
type Bucket =
  | Readonly<{ remaining: number; resetAt: number }>
  | { remaining: number; resetAt: number }
const buckets: Map<string, Bucket> = new Map()
app.use("*", async (c: Context, next: Next) => {
  const ip: string = getClientIp(c)
  if (ratelimit) {
    try {
      const res = await ratelimit.limit(ip)
      c.res.headers.set("X-RateLimit-Limit", String(apiEnv.API_RATE_LIMIT_MAX))
      c.res.headers.set("X-RateLimit-Remaining", String(res.remaining))
      c.res.headers.set("X-RateLimit-Reset", String(res.reset))
      if (!res.success) return c.json({ error: "Too Many Requests" }, 429, { "Retry-After": "1" })
      return next()
    } catch {
      // fall through to memory fallback on error
    }
  }
  const now: number = Date.now()
  const windowMs: number = apiEnv.API_RATE_LIMIT_WINDOW_MS
  const max: number = apiEnv.API_RATE_LIMIT_MAX
  const key: string = `${ip}:${Math.floor(now / windowMs)}`
  let b = buckets.get(key)
  if (!b) {
    b = { remaining: max, resetAt: (Math.floor(now / windowMs) + 1) * windowMs }
    buckets.set(key, b)
  }
  if (b.remaining <= 0) {
    const retry: number = Math.max(0, b.resetAt - now)
    return c.json({ error: "Too Many Requests" }, 429, {
      "Retry-After": Math.ceil(retry / 1000).toString(),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": b.resetAt.toString(),
    })
  }
  ;(b as { remaining: number }).remaining -= 1
  return next()
})

// Request logging (after rate limit to avoid noise)
app.use("*", async (c: Context, next: Next) => {
  const start: number = c.get("reqStartMs")
  const reqId: string = c.get("reqId")
  const ip: string = getClientIp(c)
  await next()
  const dur: number = Date.now() - start
  const path: string = c.req.path
  const isAdmin: boolean = path.startsWith("/api/v1/admin")
  const user = c.get("user") as { email?: string } | null
  const email: string = user?.email ?? "anonymous"
  try {
    console.log(
      JSON.stringify({
        level: "info",
        reqId,
        ip,
        method: c.req.method,
        path,
        status: c.res.status,
        durMs: dur,
        user: isAdmin ? email : undefined,
      }),
    )
  } catch {
    // no-op
  }
  incMetric(c.req.method, c.res.status)
})

// Attach session and user to context for downstream routes
app.use("*", async (c: Context, next: Next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set("user", null)
    c.set("session", null)
    return next()
  }
  c.set("user", session.user)
  c.set("session", session.session)
  return next()
})

// Admin audit logging for mutating requests
app.use("/api/v1/admin/*", async (c: Context, next: Next) => {
  const method: string = c.req.method.toUpperCase()
  const mutating: boolean =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE"
  if (mutating) {
    const reqId: string = ((): string => {
      try {
        return c.get("reqId")
      } catch {
        return "unknown"
      }
    })()
    const user = ((): { email?: string } | null => {
      try {
        return c.get("user") as { email?: string } | null
      } catch {
        return null
      }
    })()
    const email: string = user?.email ?? "anonymous"
    try {
      console.log(
        JSON.stringify({
          level: "info",
          type: "audit",
          reqId,
          method,
          path: c.req.path,
          user: email,
        }),
      )
    } catch {}
  }
  return next()
})

// Note: Better Auth is mounted in Next.js route `apps/web/src/app/api/auth/[...all]/route.ts`.
// Do not mount it here to avoid duplicate handlers and route conflicts.

// Shop API v1 routes
app.route("/api/v1/products", productsRoute)
app.route("/api/v1/categories", categoriesRoute)
app.route("/api/v1/cart", cartRoute)
app.route("/api/v1/orders", ordersRoute)
app.route("/api/v1/wishlist", wishlistRoute)
app.route("/api/v1/affiliate", affiliateRoute)
app.route("/api/v1/contact", contactRoute)
app.route("/api/v1/payments/stripe", paymentsStripeRoute)
app.route("/api/v1/payments/paypal", paymentsPaypalRoute)
app.route("/api/v1/checkout", checkoutRoute)
app.route("/api/v1/admin", adminRoute)
app.route("/api/v1/admin/affiliate", adminAffiliateRoute)
app.route("/api/v1/admin/reviews", adminReviewsRoute)
app.route("/api/v1/admin/customers", adminCustomersRoute)
app.route("/api/v1/account/addresses", accountAddressesRoute)
app.route("/api/v1/account/preferences", accountPreferencesRoute)
app.route("/api/v1/account/reviews", accountReviewsRoute)
app.route("/api/v1/reviews", reviewsRoute)
if (process.env.NODE_ENV !== "production") {
  app.route("/api/test", testRoute)
}

// Health/Readiness/Metrics
app.get("/api/health", (c: Context) => c.json({ ok: true }))
app.get("/api/healthz", async (c: Context) => {
  const uptime: number = Math.floor(process.uptime())
  const [dbOk, redisOk] = await Promise.all([
    checkDbReady(DB_READY_TIMEOUT_MS),
    checkRedisReady(1000),
  ])
  const res = {
    ok: dbOk && redisOk,
    uptime,
    dbOk,
    redisOk,
    stripeConfigured: apiEnv.STRIPE_CONFIGURED,
    paypalConfigured: apiEnv.PAYPAL_CONFIGURED,
    resendConfigured: apiEnv.RESEND_CONFIGURED,
    rateLimitProvider: ratelimit ? "upstash" : "memory",
  } as const
  return c.json(res, 200)
})
app.get("/api/readyz", async (c: Context) => {
  const [dbOk, redisOk] = await Promise.all([
    checkDbReady(DB_READY_TIMEOUT_MS),
    checkRedisReady(1000),
  ])
  const ready: boolean = dbOk && redisOk
  return c.json({ ready, dbOk, redisOk }, ready ? 200 : 503)
})
app.get("/api/metrics", (c: Context) => c.text(renderMetrics(), 200))

// Global error handler
app.onError((err, c) => {
  const reqId: string = ((): string => {
    try {
      return c.get("reqId")
    } catch {
      return "unknown"
    }
  })()
  const method: string = c.req.method
  const path: string = c.req.path
  const ip: string = getClientIp(c)
  const user = ((): { email?: string } | null => {
    try {
      return c.get("user") as { email?: string } | null
    } catch {
      return null
    }
  })()
  const email: string = user?.email ?? "anonymous"
  if (err instanceof ZodError) {
    const details = err.flatten ? err.flatten() : undefined
    const issues = (err.issues ?? [])
      .slice(0, 10)
      .map((i) => ({ path: (i.path ?? []).join("."), code: i.code, message: i.message }))
    try {
      console.warn(
        JSON.stringify({
          level: "warn",
          kind: "validation",
          reqId,
          method,
          path,
          ip,
          user: email,
          issuesCount: err.issues?.length ?? 0,
          issues,
        }),
      )
    } catch {}
    return c.json({ error: "Invalid request", details, reqId }, 400)
  }
  const message: string = err instanceof Error ? err.message : String(err)
  const name: string | undefined = err instanceof Error ? err.name : undefined
  const stack: string | undefined =
    process.env.NODE_ENV !== "production" && err instanceof Error ? err.stack : undefined
  try {
    console.error(
      JSON.stringify({
        level: "error",
        kind: "exception",
        reqId,
        method,
        path,
        ip,
        user: email,
        name,
        message,
        stack,
      }),
    )
  } catch {}
  return c.json({ error: "Internal Server Error", reqId }, 500)
})

// 404 handler
app.notFound((c: Context) => c.json({ error: "Not Found" }, 404))
