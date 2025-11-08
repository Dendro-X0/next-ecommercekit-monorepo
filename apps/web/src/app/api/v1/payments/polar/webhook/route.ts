import { NextRequest, NextResponse } from "next/server"
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks"

export async function POST(req: NextRequest): Promise<Response> {
  const secret: string | undefined = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 })

  // Read the raw body for signature verification
  const body = await req.arrayBuffer()
  try {
    const event = validateEvent(Buffer.from(body), Object.fromEntries(req.headers), secret)

    // TODO: map event.type → internal handlers (order.created, order.updated, etc.)
    // For now, just acknowledge to avoid retries
    return new NextResponse("", { status: 202 })
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new NextResponse("", { status: 403 })
    }
    return new NextResponse("", { status: 500 })
  }
}
