import { contactsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { Resend } from "resend"
import { ZodError, z } from "zod"
import { apiEnv } from "../env"
import { validate } from "../lib/validate"

/**
 * Contact routes.
 * POST-only endpoint that accepts a contact message and responds with 202.
 * Email/DB delivery can be added incrementally in follow-up steps.
 */
const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  phone: z.string().trim().max(50).optional().default(""),
})

type ContactBody = Readonly<z.infer<typeof bodySchema>>

// In-memory, per-process token bucket (sufficient for dev/single-instance)
type Bucket = Readonly<{ count: number; resetAt: number }>
const buckets: Map<string, Bucket> = new Map()

function getIp(c: Context): string {
  const fwd: string | undefined = c.req.header("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  const real: string | undefined = c.req.header("x-real-ip")
  return real ?? "unknown"
}

function allowRequest(ip: string): boolean {
  const now: number = Date.now()
  const max: number = apiEnv.CONTACT_RATE_LIMIT_MAX
  const windowMs: number = apiEnv.CONTACT_RATE_LIMIT_WINDOW_MS
  const b = buckets.get(ip)
  if (!b || now >= b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count < max) {
    buckets.set(ip, { count: b.count + 1, resetAt: b.resetAt })
    return true
  }
  return false
}

async function sendContactEmail(data: ContactBody): Promise<void> {
  const apiKey: string | undefined = apiEnv.RESEND_API_KEY
  const from: string = apiEnv.EMAIL_FROM ?? "no-reply@localhost"
  // Prefer first admin email as recipient; fall back to EMAIL_FROM
  const [to] = Array.from(apiEnv.ADMIN_EMAILS_SET)
  const recipient: string | undefined = to ?? apiEnv.EMAIL_FROM
  if (!apiKey || !recipient) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Contact] Email disabled: missing RESEND_API_KEY or recipient (ADMIN_EMAILS/EMAIL_FROM)",
    )
    return
  }
  const resend = new Resend(apiKey)
  const subject: string = `[Contact] ${data.subject}`
  const text: string = `From: ${data.name} <${data.email}>\nPhone: ${data.phone ?? ""}\n\n${data.message}`
  const html: string = `
    <h3>New contact message</h3>
    <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
    <p><strong>Phone:</strong> ${data.phone ?? ""}</p>
    <pre style="white-space:pre-wrap">${data.message}</pre>
  `
  await resend.emails.send({ from, to: recipient, subject, text, html })
}

const route = new Hono()
  /**
   * POST /api/v1/contact
   * Accepts a contact message payload. Returns 202 on acceptance.
   */
  .post("/", async (c: Context) => {
    try {
      const data: ContactBody = await validate.body(c, bodySchema)
      const ip: string = getIp(c)
      if (!allowRequest(ip)) {
        return c.json({ error: "Too Many Requests" }, 429)
      }
      // Log minimal info for observability
      // eslint-disable-next-line no-console
      console.info("[Contact] Accepted", { email: data.email, subject: data.subject, ip })
      try {
        await sendContactEmail(data)
      } catch (e) {
        console.warn("[Contact] Email send failed", e)
      }
      try {
        await contactsRepo.create({ ...data, ip })
      } catch (e) {
        console.warn("[Contact] Persist failed", e)
      }
      return c.json({ ok: true }, 202)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ error: "Invalid request" }, 400)
      }
      const message: string =
        err instanceof Error ? err.message : "Failed to accept contact message"
      return c.json({ error: message }, 500)
    }
  })

export default route
