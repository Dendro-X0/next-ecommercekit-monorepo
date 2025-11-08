import { NextRequest, NextResponse } from "next/server"
import { Polar } from "@polar-sh/sdk"

export async function GET(req: NextRequest): Promise<Response> {
  const accessToken: string | undefined = process.env.POLAR_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: "Polar not configured" }, { status: 500 })
  }
  const server = (process.env.POLAR_SERVER === "production" ? "production" : "sandbox") as
    | "production"
    | "sandbox"
  const polar = new Polar({ accessToken, server })

  const { searchParams } = new URL(req.url)
  const productPriceId: string | null = searchParams.get("product_price_id")
  const productId: string | null = searchParams.get("product_id")
  const successUrl: string | null =
    searchParams.get("success_url") ?? process.env.POLAR_SUCCESS_URL ?? null

  try {
    // CheckoutCreate requires products list; prefer product_id. Price-id is not supported here.
    if (!productId) {
      return NextResponse.json(
        { error: "Missing product_id (product_price_id not supported in this route)" },
        { status: 400 },
      )
    }
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: successUrl ?? undefined,
    })
    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    return NextResponse.json({ error: "Checkout creation failed" }, { status: 500 })
  }
}
