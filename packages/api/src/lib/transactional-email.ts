import { render } from "@react-email/render"
import OrderCancelledEmail from "@repo/emails/order-cancelled-email"
import OrderCreatedEmail from "@repo/emails/order-created-email"
import OrderPaidEmail from "@repo/emails/order-paid-email"
import OrderRefundedEmail from "@repo/emails/order-refunded-email"
import OrderShippedEmail from "@repo/emails/order-shipped-email"
import React from "react"
import { Resend } from "resend"
import { apiEnv } from "../env"

// In-memory email metrics (exported for /api/metrics aggregation)
type EmailOutcome = "success" | "failure"
function toEmailKey(kind: string, outcome: EmailOutcome): string {
  return `${kind}|${outcome}`
}
const emailCounters: Map<string, number> = new Map()
function incEmailMetric(kind: string, outcome: EmailOutcome): void {
  const key: string = toEmailKey(kind, outcome)
  emailCounters.set(key, (emailCounters.get(key) ?? 0) + 1)
}
export function renderEmailMetrics(): string {
  const lines: string[] = [
    "# HELP email_sends_total Total transactional email sends",
    "# TYPE email_sends_total counter",
  ]
  for (const [k, v] of emailCounters.entries()) {
    const [kind, outcome] = k.split("|")
    lines.push(`email_sends_total{kind="${kind}",outcome="${outcome}"} ${v}`)
  }
  return `${lines.join("\n")}\n`
}

/**
 * Transactional email sender using Resend.
 * No-ops when RESEND_API_KEY or EMAIL_FROM are not configured.
 */
interface TransactionalEmail {
  readonly orderCreated: (
    params: Readonly<{ email: string; orderId: string; totalCents?: number }>,
  ) => Promise<void>
  readonly orderPaid: (
    params: Readonly<{ email: string; orderId: string; totalCents?: number }>,
  ) => Promise<void>
  readonly orderCancelled: (
    params: Readonly<{ email: string; orderId: string; totalCents?: number }>,
  ) => Promise<void>
  readonly orderShipped: (
    params: Readonly<{ email: string; orderId: string; totalCents?: number }>,
  ) => Promise<void>
  readonly orderRefunded: (
    params: Readonly<{ email: string; orderId: string; totalCents?: number }>,
  ) => Promise<void>
}

export const transactionalEmail: TransactionalEmail = (() => {
  type SendParams = Readonly<{ email: string; orderId: string; totalCents?: number }>
  function isConfigured(): boolean {
    return Boolean(apiEnv.RESEND_API_KEY && apiEnv.EMAIL_FROM)
  }
  async function sendWithRetry(
    {
      to,
      subject,
      html,
      text,
    }: Readonly<{ to: string; subject: string; html: string; text: string }>,
    kind: string,
  ): Promise<void> {
    const resend: Resend = new Resend(apiEnv.RESEND_API_KEY!)
    const maxAttempts: number = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await resend.emails.send({ from: apiEnv.EMAIL_FROM!, to, subject, html, text })
        incEmailMetric(kind, "success")
        return
      } catch (err) {
        const name: string | undefined = err instanceof Error ? err.name : undefined
        const message: string = err instanceof Error ? err.message : String(err)
        try {
          console.warn(
            JSON.stringify({
              level: "warn",
              kind: "email",
              event: "send_failed",
              attempt,
              maxAttempts,
              type: kind,
              to,
              subject,
              name,
              message,
            }),
          )
        } catch {}
        if (attempt === maxAttempts) {
          incEmailMetric(kind, "failure")
          return // do not throw; avoid impacting business flow
        }
        const backoffMs: number = 250 * 2 ** (attempt - 1) // 250, 500
        await new Promise<void>((r) => setTimeout(r, backoffMs))
      }
    }
  }
  async function renderEmail(
    el: React.ReactElement,
  ): Promise<Readonly<{ html: string; text: string }>> {
    const html: string = await render(el)
    const text: string = await render(el, { plainText: true })
    return { html, text } as const
  }
  async function orderCreated(params: SendParams): Promise<void> {
    const subject: string = `Order ${params.orderId} received`
    if (!isConfigured()) {
      console.log("[email] skipped (not configured)", { subject, to: params.email })
      return
    }
    const { html, text } = await renderEmail(
      React.createElement(OrderCreatedEmail, {
        orderId: params.orderId,
        totalCents: params.totalCents,
      }),
    )
    await sendWithRetry({ to: params.email, subject, html, text }, "orderCreated")
  }
  async function orderPaid(params: SendParams): Promise<void> {
    const subject: string = `Order ${params.orderId} paid`
    if (!isConfigured()) {
      console.log("[email] skipped (not configured)", { subject, to: params.email })
      return
    }
    const { html, text } = await renderEmail(
      React.createElement(OrderPaidEmail, {
        orderId: params.orderId,
        totalCents: params.totalCents,
      }),
    )
    await sendWithRetry({ to: params.email, subject, html, text }, "orderPaid")
  }
  async function orderCancelled(params: SendParams): Promise<void> {
    const subject: string = `Order ${params.orderId} cancelled`
    if (!isConfigured()) {
      console.log("[email] skipped (not configured)", { subject, to: params.email })
      return
    }
    const { html, text } = await renderEmail(
      React.createElement(OrderCancelledEmail, {
        orderId: params.orderId,
        totalCents: params.totalCents,
      }),
    )
    await sendWithRetry({ to: params.email, subject, html, text }, "orderCancelled")
  }
  async function orderShipped(params: SendParams): Promise<void> {
    const subject: string = `Order ${params.orderId} shipped`
    if (!isConfigured()) {
      console.log("[email] skipped (not configured)", { subject, to: params.email })
      return
    }
    const { html, text } = await renderEmail(
      React.createElement(OrderShippedEmail, { orderId: params.orderId }),
    )
    await sendWithRetry({ to: params.email, subject, html, text }, "orderShipped")
  }
  async function orderRefunded(params: SendParams): Promise<void> {
    const subject: string = `Order ${params.orderId} refunded`
    if (!isConfigured()) {
      console.log("[email] skipped (not configured)", { subject, to: params.email })
      return
    }
    const { html, text } = await renderEmail(
      React.createElement(OrderRefundedEmail, {
        orderId: params.orderId,
        totalCents: params.totalCents,
      }),
    )
    await sendWithRetry({ to: params.email, subject, html, text }, "orderRefunded")
  }
  return { orderCreated, orderPaid, orderCancelled, orderShipped, orderRefunded } as const
})()
