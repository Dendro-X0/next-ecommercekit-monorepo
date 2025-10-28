import { z } from "zod"

/**
 * Server-only environment validation for the API package.
 */
export const apiEnv = (() => {
  // Prefer explicit WEB_ORIGIN, but gracefully fall back to APP_URL or NEXT_PUBLIC_APP_URL
  // to avoid crashes in local/dev when WEB_ORIGIN is not set.
  const sanitizeUrlLike = (val: unknown): unknown => {
    if (typeof val !== "string") return val
    let t = val.trim()
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      t = t.slice(1, -1).trim()
    }
    if (t === "") return undefined
    if (!/^https?:\/\//i.test(t)) {
      t = t.includes("localhost") || t.includes("127.0.0.1") ? `http://${t}` : `https://${t}`
    }
    try {
      const u = new URL(t)
      let out = u.toString()
      if (out.endsWith("/")) out = out.slice(0, -1)
      return out
    } catch {
      return undefined
    }
  }
  const raw = {
    WEB_ORIGIN:
      process.env.WEB_ORIGIN ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",
    AFFILIATE_COMMISSION_PCT: process.env.AFFILIATE_COMMISSION_PCT ?? "10",
    TAX_RATE: process.env.TAX_RATE ?? "0.08",
    FREE_SHIPPING_THRESHOLD: process.env.FREE_SHIPPING_THRESHOLD ?? "50",
    FLAT_SHIPPING_FEE: process.env.FLAT_SHIPPING_FEE ?? "9.99",
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? undefined,
    EMAIL_FROM: process.env.EMAIL_FROM ?? undefined,
    CONTACT_RATE_LIMIT_MAX: process.env.CONTACT_RATE_LIMIT_MAX ?? undefined,
    CONTACT_RATE_LIMIT_WINDOW_MS: process.env.CONTACT_RATE_LIMIT_WINDOW_MS ?? undefined,
    API_RATE_LIMIT_MAX: process.env.API_RATE_LIMIT_MAX ?? undefined,
    API_RATE_LIMIT_WINDOW_MS: process.env.API_RATE_LIMIT_WINDOW_MS ?? undefined,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? undefined,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? undefined,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ?? undefined,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ?? undefined,
    PAYPAL_MODE: process.env.PAYPAL_MODE ?? undefined, // "sandbox" | "live"
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID ?? undefined,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? undefined,
  } as const

  const schema = z.object({
    WEB_ORIGIN: z.preprocess(
      sanitizeUrlLike,
      z.string().url("WEB_ORIGIN must be a valid URL").default("http://localhost:3000"),
    ),
    ADMIN_EMAILS: z.string().optional().default(""),
    AFFILIATE_COMMISSION_PCT: z.preprocess((v) => {
      if (typeof v !== "string") return v
      const s = v.trim()
      if (s === "") return undefined // allow default when empty
      const cleaned = s.endsWith("%") ? s.slice(0, -1).trim() : s
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : undefined // fall back to default on NaN
    }, z
      .number()
      .min(0, "AFFILIATE_COMMISSION_PCT must be >= 0")
      .max(100, "AFFILIATE_COMMISSION_PCT must be <= 100")
      .default(10)),
    TAX_RATE: z.preprocess((v) => {
      if (typeof v !== "string") return v
      const s = v.trim()
      if (s === "") return undefined
      const cleaned = s.endsWith("%") ? s.slice(0, -1).trim() : s
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : undefined
    }, z
      .number()
      .min(0, "TAX_RATE must be >= 0")
      .max(100, "TAX_RATE must be <= 100 when provided as percent")
      .default(0.08)),
    FREE_SHIPPING_THRESHOLD: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().min(0, "FREE_SHIPPING_THRESHOLD must be >= 0").default(50),
    ),
    FLAT_SHIPPING_FEE: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().min(0, "FLAT_SHIPPING_FEE must be >= 0").default(9.99),
    ),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    CONTACT_RATE_LIMIT_MAX: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().int().positive().default(5),
    ),
    CONTACT_RATE_LIMIT_WINDOW_MS: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().int().positive().default(60_000),
    ),
    API_RATE_LIMIT_MAX: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().int().positive().default(120),
    ),
    API_RATE_LIMIT_WINDOW_MS: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined),
      z.number().int().positive().default(60_000),
    ),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_MODE: z.enum(["sandbox", "live"]).optional().default("sandbox"),
    PAYPAL_WEBHOOK_ID: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
  })

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const tried = ["WEB_ORIGIN", "APP_URL", "NEXT_PUBLIC_APP_URL"]
      .map((k) => `${k}=${process.env[k as keyof NodeJS.ProcessEnv] ?? "<unset>"}`)
      .join(", ")
    const message = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    throw new Error(
      `Invalid API environment variables: ${message}. Tried ${tried}. ` +
        `Set WEB_ORIGIN (recommended) or APP_URL/NEXT_PUBLIC_APP_URL to a valid URL (e.g. http://localhost:3000).`,
    )
  }
  const emails: readonly string[] = parsed.data.ADMIN_EMAILS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
  const ADMIN_EMAILS_SET: ReadonlySet<string> = new Set(emails)
  const AFFILIATE_COMMISSION_PCT: number = parsed.data.AFFILIATE_COMMISSION_PCT
  const TAX_RATE: number =
    parsed.data.TAX_RATE > 1 ? parsed.data.TAX_RATE / 100 : parsed.data.TAX_RATE
  const FREE_SHIPPING_THRESHOLD: number = parsed.data.FREE_SHIPPING_THRESHOLD
  const FLAT_SHIPPING_FEE: number = parsed.data.FLAT_SHIPPING_FEE
  const RESEND_API_KEY: string | undefined = parsed.data.RESEND_API_KEY
  const EMAIL_FROM: string | undefined = parsed.data.EMAIL_FROM
  const CONTACT_RATE_LIMIT_MAX: number = parsed.data.CONTACT_RATE_LIMIT_MAX
  const CONTACT_RATE_LIMIT_WINDOW_MS: number = parsed.data.CONTACT_RATE_LIMIT_WINDOW_MS
  const API_RATE_LIMIT_MAX: number = parsed.data.API_RATE_LIMIT_MAX
  const API_RATE_LIMIT_WINDOW_MS: number = parsed.data.API_RATE_LIMIT_WINDOW_MS
  const UPSTASH_REDIS_REST_URL: string | undefined = parsed.data.UPSTASH_REDIS_REST_URL
  const UPSTASH_REDIS_REST_TOKEN: string | undefined = parsed.data.UPSTASH_REDIS_REST_TOKEN
  const PAYPAL_CLIENT_ID: string | undefined = parsed.data.PAYPAL_CLIENT_ID
  const PAYPAL_CLIENT_SECRET: string | undefined = parsed.data.PAYPAL_CLIENT_SECRET
  const PAYPAL_MODE: "sandbox" | "live" = parsed.data.PAYPAL_MODE
  const PAYPAL_WEBHOOK_ID: string | undefined = parsed.data.PAYPAL_WEBHOOK_ID
  const STRIPE_CONFIGURED: boolean = Boolean(parsed.data.STRIPE_SECRET_KEY)
  const PAYPAL_CONFIGURED: boolean = Boolean(
    parsed.data.PAYPAL_CLIENT_ID &&
      parsed.data.PAYPAL_CLIENT_SECRET &&
      parsed.data.PAYPAL_WEBHOOK_ID,
  )
  const RESEND_CONFIGURED: boolean = Boolean(parsed.data.RESEND_API_KEY && parsed.data.EMAIL_FROM)

  // Enforce production-only critical environment requirements
  const isProd: boolean = process.env.NODE_ENV === "production"
  if (isProd) {
    if (!RESEND_CONFIGURED) {
      // Warn instead of throwing to allow minimal deployments (e.g., no emails in preview/demo)
      console.warn(
        "[api/env] RESEND not configured (RESEND_API_KEY/EMAIL_FROM). Transactional emails will be skipped.",
      )
    }
    if (!STRIPE_CONFIGURED && !PAYPAL_CONFIGURED) {
      // Warn instead of throwing to allow minimal deployments (e.g., no payments in preview/demo)
      console.warn(
        "[api/env] No payment provider configured. Stripe/PayPal endpoints will be disabled.",
      )
    }
  }
  return {
    WEB_ORIGIN: parsed.data.WEB_ORIGIN,
    ADMIN_EMAILS_SET,
    AFFILIATE_COMMISSION_PCT,
    TAX_RATE,
    FREE_SHIPPING_THRESHOLD,
    FLAT_SHIPPING_FEE,
    RESEND_API_KEY,
    EMAIL_FROM,
    CONTACT_RATE_LIMIT_MAX,
    CONTACT_RATE_LIMIT_WINDOW_MS,
    API_RATE_LIMIT_MAX,
    API_RATE_LIMIT_WINDOW_MS,
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET,
    PAYPAL_MODE,
    PAYPAL_WEBHOOK_ID,
    STRIPE_CONFIGURED,
    PAYPAL_CONFIGURED,
    RESEND_CONFIGURED,
  } as const
})()
