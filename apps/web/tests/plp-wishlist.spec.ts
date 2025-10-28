import { expect, test } from "@playwright/test"

/**
 * PLP (homepage) wishlist toggle E2E:
 * - Navigate to home
 * - Locate first product card and its wishlist toggle
 * - Toggle heart; expect aria-pressed flip optimistically
 * - Toggle back to restore original state
 */
test("plp wishlist toggle on first product card", async ({ page }): Promise<void> => {
  // Navigate to Shop page which lists products across categories
  await page.goto("/shop")
  await page.waitForLoadState("networkidle")

  let firstCard = page.getByTestId("product-card").first()
  // Wait for element to attach to DOM (more resilient than immediate visibility)
  try {
    await firstCard.waitFor({ state: "attached", timeout: 15000 })
  } catch {
    // Fallback: try a deterministic category page
    await page.goto("/categories/apparel")
    await page.waitForLoadState("networkidle")
    firstCard = page.getByTestId("product-card").first()
    await firstCard.waitFor({ state: "attached", timeout: 15000 })
  }
  await expect(firstCard).toBeVisible({ timeout: 60000 })

  const container = firstCard.getByTestId("plp-wishlist-toggle")
  await expect(container).toBeVisible({ timeout: 60000 })

  const btn = container.getByTestId("plp-wishlist-toggle-button")
  await btn.scrollIntoViewIfNeeded()
  await expect(btn).toBeVisible({ timeout: 60000 })
  await expect(btn).toBeEnabled({ timeout: 60000 })

  const before = await btn.getAttribute("aria-pressed")
  await btn.click()
  const expectedAfter = before === "true" ? "false" : "true"
  await expect(btn).toHaveAttribute("aria-pressed", expectedAfter, { timeout: 5000 })

  // Restore original state
  await btn.click()
  await expect(btn).toHaveAttribute("aria-pressed", String(before ?? "false"), { timeout: 5000 })
})
