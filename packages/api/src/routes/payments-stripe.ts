import { createHash } from "node:crypto"
import { idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import Stripe from "stripe"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { transactionalEmail } from "../lib/transactional-email"
import { validate } from "../lib/validate"

/**
 * Minimal Stripe payments routes for test-mode integration.
 * Returns 501 when Stripe is not configured.
 */
const intentSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(10).default("usd"),
  metadata: z.record(z.string()).optional().default({}),
})

type IntentBody = Readonly<z.infer<typeof intentSchema>>

type StripeConfig = Readonly<{ configured: boolean }>

/**
 * POST /api/v1/payments/stripe/refund
 * Creates a refund for a PaymentIntent (full or partial).
 */
const refundSchema = z.object({
  paymentRef: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
})

type RefundBody = Readonly<z.infer<typeof refundSchema>>

/**
 * Capture schema for manual capture flow.
 */
const captureSchema = z.object({
  paymentRef: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
})

type CaptureBody = Readonly<z.infer<typeof captureSchema>>

function getStripe(): Stripe | null {
  const key: string | undefined = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

const IDEM_SCOPE_INTENT: string = "payments/stripe/intent"
const IDEM_SCOPE_WEBHOOK: string = "payments/stripe/webhook"

function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>()
  const replacer = (_k: string, v: unknown): unknown => {
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return undefined
      seen.add(v as object)
      const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      )
      return entries.reduce<Record<string, unknown>>((acc, [k, val]) => {
        acc[k] = val
        return acc
      }, {})
    }
    return v
  }
  return JSON.stringify(obj, replacer)
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

const route = new Hono()
  /**
   * POST /api/v1/payments/stripe/intent
   * Creates a PaymentIntent and returns its client secret.
   */
  .post("/intent", async (c: Context) => {
    const stripe = getStripe()
    if (!stripe) return c.json({ error: "Stripe is not configured" }, 501)
    const data: IntentBody = await validate.body(c, intentSchema)
    const idemKey: string | undefined =
      c.req.header("Idempotency-Key") ?? c.req.header("idempotency-key") ?? undefined
    const requestHash: string = sha256Hex(stableStringify(data))
    try {
      if (idemKey) {
        const existing = await idempotencyRepo.getByKeyScope(idemKey, IDEM_SCOPE_INTENT)
        if (existing) {
          if (existing.requestHash !== requestHash) {
            return c.json({ error: "Idempotency key reuse with different payload" }, 409)
          }
          const prev = JSON.parse(existing.responseJson) as { clientSecret: string | null }
          return c.json(prev, 201)
        }
      }

      const intent = await stripe.paymentIntents.create(
        {
          amount: data.amountCents,
          currency: data.currency,
          metadata: data.metadata,
          automatic_payment_methods: { enabled: true },
        },
        idemKey ? { idempotencyKey: idemKey } : undefined,
      )
      const body = { clientSecret: intent.client_secret } as const
      if (idemKey) {
        await idempotencyRepo.create({
          key: idemKey,
          scope: IDEM_SCOPE_INTENT,
          requestHash,
          responseJson: JSON.stringify(body),
          status: 201,
        })
      }
      return c.json(body, 201)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Failed to create payment intent"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/payments/stripe/capture
   * Admin-only: captures a PaymentIntent (full or partial when amountCents provided).
   */
  .post("/capture", async (c: Context) => {
    const stripe = getStripe()
    if (!stripe) return c.json({ error: "Stripe is not configured" }, 501)
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const data: CaptureBody = await validate.body(c, captureSchema)
    try {
      const captured = await stripe.paymentIntents.capture(
        data.paymentRef,
        data.amountCents ? { amount_to_capture: data.amountCents } : undefined,
      )
      // Update order status; webhook remains source of truth.
      const updated = await ordersRepo.updateStatusByPaymentRef(data.paymentRef, "paid")
      if (updated) {
        await inventoryRepo.commitOrder(updated.id)
      }
      return c.json({ id: captured.id, status: captured.status }, 200)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Capture failed"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/payments/stripe/refund
   * Admin-only: creates a refund for a PaymentIntent.
   */
  .post("/refund", async (c: Context) => {
    const stripe = getStripe()
    if (!stripe) return c.json({ error: "Stripe is not configured" }, 501)
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const data: RefundBody = await validate.body(c, refundSchema)
    try {
      const refund = await stripe.refunds.create({
        payment_intent: data.paymentRef,
        ...(data.amountCents ? { amount: data.amountCents } : {}),
        ...(data.reason ? { reason: data.reason } : {}),
      })
      // Update order status immediately; webhook will be the final source of truth.
      const updated = await ordersRepo.updateStatusByPaymentRef(data.paymentRef, "cancelled")
      if (updated) {
        await inventoryRepo.restockOrder(updated.id)
      }
      return c.json({ id: refund.id, status: refund.status }, 201)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Refund failed"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/payments/stripe/config
   * Indicates if Stripe is configured.
   */
  .get("/config", (c: Context) => {
    const configured: boolean = Boolean(process.env.STRIPE_SECRET_KEY)
    const res: StripeConfig = { configured }
    return c.json(res, 200)
  })
  /**
   * POST /api/v1/payments/stripe/webhook
   * Verifies signature and updates order status using PaymentIntent ID.
   */
  .post("/webhook", async (c: Context) => {
    const stripe = getStripe()
    const secret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET
    if (!stripe || !secret) return c.json({ error: "Stripe webhook not configured" }, 501)
    const sig = c.req.header("stripe-signature")
    if (!sig) return c.json({ error: "Missing signature" }, 400)
    const rawBody: string = await c.req.text()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Invalid signature"
      return c.json({ error: message }, 400)
    }
    try {
      // Idempotency: ignore duplicate deliveries by event id
      if (event.id) {
        const existing = await idempotencyRepo.getByKeyScope(event.id, IDEM_SCOPE_WEBHOOK)
        if (existing) {
          return c.json({ received: true, duplicate: true }, 200)
        }
      }
      // Determine PaymentIntent id and target status
      let intentId: string | null = null
      let target: "pending" | "paid" | "cancelled" | null = null
      let mailKind: "paid" | "cancelled" | "refunded" | null = null
      switch (event.type) {
        case "payment_intent.succeeded": {
          const pi = event.data.object as Stripe.PaymentIntent
          intentId = pi.id
          target = "paid"
          mailKind = "paid"
          break
        }
        case "payment_intent.canceled": {
          const pi = event.data.object as Stripe.PaymentIntent
          intentId = pi.id
          target = "cancelled"
          mailKind = "cancelled"
          break
        }
        case "payment_intent.processing": {
          const pi = event.data.object as Stripe.PaymentIntent
          intentId = pi.id
          target = "pending"
          break
        }
        case "payment_intent.payment_failed": {
          const pi = event.data.object as Stripe.PaymentIntent
          intentId = pi.id
          target = "cancelled"
          mailKind = "cancelled"
          break
        }
        case "payment_intent.amount_capturable_updated": {
          const pi = event.data.object as Stripe.PaymentIntent
          intentId = pi.id
          // Treat authorized but uncaptured as paid for our current status model
          target = "paid"
          mailKind = "paid"
          break
        }
        case "charge.refunded": {
          const ch = event.data.object as Stripe.Charge
          const ref = ch.payment_intent
          intentId = typeof ref === "string" ? ref : (ref?.id ?? null)
          target = "cancelled"
          mailKind = "refunded"
          break
        }
        default:
          // Ignore unhandled events
          return c.json({ received: true }, 200)
      }
      if (intentId && target) {
        const updated = await ordersRepo.updateStatusByPaymentRef(intentId, target)
        if (updated) {
          if (target === "paid") {
            await inventoryRepo.commitOrder(updated.id)
          } else if (target === "cancelled") {
            await inventoryRepo.restockOrder(updated.id)
          }
          try {
            if (updated.email && mailKind) {
              if (mailKind === "paid") {
                await transactionalEmail.orderPaid({
                  email: updated.email,
                  orderId: updated.id,
                  totalCents: updated.totalCents,
                })
              } else if (mailKind === "refunded") {
                await transactionalEmail.orderRefunded({
                  email: updated.email,
                  orderId: updated.id,
                  totalCents: updated.totalCents,
                })
              } else if (mailKind === "cancelled") {
                await transactionalEmail.orderCancelled({
                  email: updated.email,
                  orderId: updated.id,
                  totalCents: updated.totalCents,
                })
              }
            }
          } catch (mailErr) {
            console.error("[stripe] email send failed", {
              orderId: updated.id,
              error: mailErr instanceof Error ? mailErr.message : String(mailErr),
            })
          }
        }
      }
      const resBody = { received: true } as const
      if (event.id) {
        await idempotencyRepo.create({
          key: event.id,
          scope: IDEM_SCOPE_WEBHOOK,
          requestHash: "-",
          responseJson: JSON.stringify(resBody),
          status: 200,
        })
      }
      return c.json(resBody, 200)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Webhook handling failed"
      return c.json({ error: message }, 500)
    }
  })

export default route
