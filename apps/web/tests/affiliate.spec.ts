import { expect, test } from "@playwright/test"

/**
 * Affiliate E2E: ref cookie -> track -> order -> conversion created.
 */
test("affiliate conversion created on order", async ({ page }): Promise<void> => {
  const code: string = `AFF${Math.random().toString(36).slice(2, 8)}`
  await page.goto(`/?ref=${code}`)
  await expect(page).toHaveURL(/\/?ref=/)
  // Wait for tracker to post
  const tracked = await page.waitForResponse(
    (resp) => {
      try {
        const url = new URL(resp.url())
        return (
          url.pathname.endsWith("/api/v1/affiliate/track") &&
          resp.request().method() === "POST" &&
          resp.status() === 201
        )
      } catch {
        return false
      }
    },
    { timeout: 60000 },
  )
  expect(tracked.ok()).toBeTruthy()
  // Place an order via in-page fetch to include cookies
  const order = await page.evaluate(async (): Promise<{ id: string }> => {
    const body = {
      email: "test@example.com",
      items: [{ name: "Test Item", price: 25.0, quantity: 2 }],
      subtotal: 50.0,
      shipping: 0,
      tax: 0,
      total: 50.0,
    } as const
    const res = await fetch("/api/v1/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Order create failed: ${res.status}`)
    const json = (await res.json()) as { id: string }
    return { id: json.id }
  })
  expect(order.id).toBeTruthy()
  // Fetch latest conversion via dev test endpoint
  const convResp = await page.request.get("/api/test/affiliate/last-conversion")
  expect(convResp.ok()).toBeTruthy()
  const conv = (await convResp.json()) as {
    id: string
    orderId: string
    code: string
    status: string
    commissionCents: number
  }
  expect(conv.orderId).toBe(order.id)
  expect(conv.code).toBe(code)
  expect(conv.status).toMatch(/pending|approved|paid/)
  expect(conv.commissionCents).toBeGreaterThanOrEqual(0)
})
