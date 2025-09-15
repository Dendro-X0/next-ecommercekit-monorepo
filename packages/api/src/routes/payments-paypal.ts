import { idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { apiEnv } from "../env"
import { transactionalEmail } from "../lib/transactional-email"
import { validate } from "../lib/validate"

/**
 * PayPal REST integration (Orders v2) using direct HTTP calls.
 * Works in sandbox by default; return 501 when not configured.
 */

type PaypalMode = "sandbox" | "live"

type PaypalConfig = Readonly<{
  configured: boolean
  mode: PaypalMode
}>

const IDEM_SCOPE_WEBHOOK: string = "payments/paypal/webhook"

const createSchema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(10).default("USD"),
})

type CreateBody = Readonly<z.infer<typeof createSchema>>

const captureSchema = z.object({
  orderId: z.string().min(1),
})

type CaptureBody = Readonly<z.infer<typeof captureSchema>>

function getBaseUrl(mode: PaypalMode): string {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

async function getAccessToken({
  clientId,
  clientSecret,
  mode,
}: Readonly<{ clientId: string; clientSecret: string; mode: PaypalMode }>): Promise<string> {
  const url: string = `${getBaseUrl(mode)}/v1/oauth2/token`
  const auth: string = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const res: Response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  })
  if (!res.ok) throw new Error(`PayPal token failed (${res.status})`)
  const json = (await res.json()) as Readonly<{ access_token: string }>
  return json.access_token
}

function centsToAmountStr(cents: number): string {
  const dollars: number = Math.trunc(cents / 100)
  const remainder: number = Math.abs(cents % 100)
  const frac: string = remainder.toString().padStart(2, "0")
  return `${dollars}.${frac}`
}

const route = new Hono()
  /**
   * GET /api/v1/payments/paypal/config
   */
  .get("/config", (c: Context) => {
    const configured: boolean = Boolean(apiEnv.PAYPAL_CLIENT_ID && apiEnv.PAYPAL_CLIENT_SECRET)
    const res: PaypalConfig = { configured, mode: apiEnv.PAYPAL_MODE }
    return c.json(res, 200)
  })
  /**
   * POST /api/v1/payments/paypal/create
   * Creates a PayPal order with intent CAPTURE and returns id + approve link.
   */
  .post("/create", async (c: Context) => {
    if (!apiEnv.PAYPAL_CLIENT_ID || !apiEnv.PAYPAL_CLIENT_SECRET)
      return c.json({ error: "PayPal is not configured" }, 501)
    const body: CreateBody = await validate.body(c, createSchema)
    try {
      const token = await getAccessToken({
        clientId: apiEnv.PAYPAL_CLIENT_ID,
        clientSecret: apiEnv.PAYPAL_CLIENT_SECRET,
        mode: apiEnv.PAYPAL_MODE,
      })
      const res: Response = await fetch(`${getBaseUrl(apiEnv.PAYPAL_MODE)}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: body.currency.toUpperCase(),
                value: centsToAmountStr(body.amountCents),
              },
            },
          ],
          application_context: {
            return_url: `${apiEnv.WEB_ORIGIN}/paypal/return`,
            cancel_url: `${apiEnv.WEB_ORIGIN}/paypal/cancel`,
          },
        }),
      })
      if (!res.ok) return c.json({ error: `Create order failed (${res.status})` }, 502)
      const data = (await res.json()) as Readonly<{
        id: string
        links?: ReadonlyArray<{ rel: string; href: string }>
      }>
      const approveUrl: string | undefined = data.links?.find((l) => l.rel === "approve")?.href
      return c.json({ id: data.id, approveUrl: approveUrl ?? null }, 201)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Create order failed"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/payments/paypal/capture
   * Captures a PayPal order by id and updates order status by paymentRef.
   */
  .post("/capture", async (c: Context) => {
    if (!apiEnv.PAYPAL_CLIENT_ID || !apiEnv.PAYPAL_CLIENT_SECRET)
      return c.json({ error: "PayPal is not configured" }, 501)
    const body: CaptureBody = await validate.body(c, captureSchema)
    try {
      const token = await getAccessToken({
        clientId: apiEnv.PAYPAL_CLIENT_ID,
        clientSecret: apiEnv.PAYPAL_CLIENT_SECRET,
        mode: apiEnv.PAYPAL_MODE,
      })
      const res: Response = await fetch(
        `${getBaseUrl(apiEnv.PAYPAL_MODE)}/v2/checkout/orders/${body.orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      )
      if (!res.ok) return c.json({ error: `Capture failed (${res.status})` }, 502)
      const data = (await res.json()) as Readonly<{
        id: string
        status?: string
        purchase_units?: unknown
      }>
      // Treat successful capture as paid. Webhook remains final source of truth.
      const updated = await ordersRepo.updateStatusByPaymentRef(body.orderId, "paid")
      if (updated) {
        await inventoryRepo.commitOrder(updated.id)
      }
      return c.json({ id: data.id, status: data.status ?? "COMPLETED" }, 200)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Capture failed"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/payments/paypal/webhook
   * Verifies the webhook signature with PayPal and updates order status.
   */
  .post("/webhook", async (c: Context) => {
    const webhookId = apiEnv.PAYPAL_WEBHOOK_ID
    if (!apiEnv.PAYPAL_CLIENT_ID || !apiEnv.PAYPAL_CLIENT_SECRET || !webhookId)
      return c.json({ error: "PayPal webhook not configured" }, 501)
    try {
      const transmissionId = c.req.header("paypal-transmission-id") ?? ""
      const transmissionTime = c.req.header("paypal-transmission-time") ?? ""
      const certUrl = c.req.header("paypal-cert-url") ?? ""
      const authAlgo = c.req.header("paypal-auth-algo") ?? ""
      const transmissionSig = c.req.header("paypal-transmission-sig") ?? ""
      if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
        return c.json({ error: "Missing webhook headers" }, 400)
      }
      const rawBody: string = await c.req.text()
      // Idempotency: use PayPal transmission id as delivery key
      if (transmissionId) {
        const existing = await idempotencyRepo.getByKeyScope(transmissionId, IDEM_SCOPE_WEBHOOK)
        if (existing) return c.json({ received: true, duplicate: true }, 200)
      }
      const token = await getAccessToken({
        clientId: apiEnv.PAYPAL_CLIENT_ID,
        clientSecret: apiEnv.PAYPAL_CLIENT_SECRET,
        mode: apiEnv.PAYPAL_MODE,
      })
      const verifyRes: Response = await fetch(
        `${getBaseUrl(apiEnv.PAYPAL_MODE)}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: authAlgo,
            cert_url: certUrl,
            transmission_id: transmissionId,
            transmission_sig: transmissionSig,
            transmission_time: transmissionTime,
            webhook_id: webhookId,
            webhook_event: JSON.parse(rawBody),
          }),
        },
      )
      if (!verifyRes.ok)
        return c.json({ error: `Webhook verify failed (${verifyRes.status})` }, 502)
      const verifyJson = (await verifyRes.json()) as Readonly<{ verification_status: string }>
      if (
        verifyJson.verification_status !== "SUCCESS" &&
        verifyJson.verification_status !== "VERIFIED"
      ) {
        return c.json({ error: "Webhook not verified" }, 400)
      }
      // Process event with robust orderId extraction
      type PaypalLink = Readonly<{ rel: string; href: string }>
      type PaypalResource = Readonly<{
        id?: string
        status?: string
        supplementary_data?: Readonly<{ related_ids?: Readonly<{ order_id?: string }> }>
        links?: ReadonlyArray<PaypalLink>
      }>
      const event = JSON.parse(rawBody) as Readonly<{
        event_type?: string
        resource?: PaypalResource
      }>

      function getOrderIdFromCapture(resource: PaypalResource | undefined): string | null {
        if (!resource) return null
        const bySupplementary: string | undefined =
          resource.supplementary_data?.related_ids?.order_id
        if (bySupplementary) return bySupplementary
        const upHref: string | undefined = resource.links?.find((l) => l.rel === "up")?.href
        if (upHref) {
          const match = /\/v2\/checkout\/orders\/([A-Za-z0-9-]+)/.exec(upHref)
          if (match?.[1]) return match[1]
        }
        return null
      }

      let orderId: string | null = null
      let target: "pending" | "paid" | "cancelled" | null = null
      let mailKind: "paid" | "cancelled" | "refunded" | null = null
      switch (event.event_type) {
        case "CHECKOUT.ORDER.APPROVED":
          orderId = event.resource?.id ?? null
          target = "pending"
          break
        case "PAYMENT.CAPTURE.COMPLETED":
          orderId = getOrderIdFromCapture(event.resource)
          target = "paid"
          mailKind = "paid"
          break
        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.REFUNDED":
          orderId = getOrderIdFromCapture(event.resource)
          target = "cancelled"
          mailKind = event.event_type === "PAYMENT.CAPTURE.REFUNDED" ? "refunded" : "cancelled"
          break
        default: {
          const resBody = { received: true } as const
          if (transmissionId) {
            await idempotencyRepo.create({
              key: transmissionId,
              scope: IDEM_SCOPE_WEBHOOK,
              requestHash: "-",
              responseJson: JSON.stringify(resBody),
              status: 200,
            })
          }
          return c.json(resBody, 200)
        }
      }
      if (orderId && target) {
        const updated = await ordersRepo.updateStatusByPaymentRef(orderId, target)
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
            console.error("[paypal] email send failed", {
              orderId: updated.id,
              error: mailErr instanceof Error ? mailErr.message : String(mailErr),
            })
          }
        }
      }
      const resBody = { received: true } as const
      if (transmissionId) {
        await idempotencyRepo.create({
          key: transmissionId,
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
