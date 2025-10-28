import { expect, test } from "@playwright/test"

const contactPath = "/contact" as const

async function mockContactOk(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/contact", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    })
  })
}

async function mockContactRateLimited(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/contact", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "Too Many Requests" }),
    })
  })
}

test.describe("Contact form", () => {
  test("submits successfully and shows success state", async ({ page }) => {
    await mockContactOk(page)
    await page.goto(contactPath)

    await page.locator("#name").fill("John Doe")
    await page.locator("#email").fill("john@example.com")
    await page.locator("#phone").fill("+1 555 000 1111")

    // Subject select
    await page.getByLabel("Subject").click()
    await page.getByRole("option", { name: "General Inquiry" }).click()

    await page.locator("#message").fill("Hello! I would like to know more about your products.")

    await page.getByRole("button", { name: /send message/i }).click()

    await expect(page.getByText(/message sent successfully!/i)).toBeVisible()
  })

  test("shows error toast when rate limited (429)", async ({ page }) => {
    await mockContactRateLimited(page)
    await page.goto(contactPath)

    await page.locator("#name").fill("Jane Tester")
    await page.locator("#email").fill("jane@example.com")
    await page.locator("#phone").fill("+1 222 333 4444")

    await page.getByLabel("Subject").click()
    await page.getByRole("option", { name: "General Inquiry" }).click()

    await page.locator("#message").fill("Testing rate limiting path.")

    await page.getByRole("button", { name: /send message/i }).click()

    // Client throws with status in message; toast uses that
    await expect(page.getByText(/failed to submit contact message \(429\)/i)).toBeVisible()
  })
})
