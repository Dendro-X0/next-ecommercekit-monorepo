import { expect, test } from "@playwright/test"

/**
 * Wishlist toggle E2E:
 * - Navigate to first product PDP from home
 * - Toggle heart button; expect aria-pressed state to flip optimistically
 * - Toggle back to restore original state
 */
test("wishlist toggle from PDP", async ({ page }): Promise<void> => {
  // Navigate deterministically to seeded product (from DB seed script)
  await page.goto("/products/classic-t-shirt")
  // Accept optional in-page hash (e.g., #description) added by links or focus management
  await expect(page).toHaveURL(/\/products\/classic-t-shirt(#[\w-]+)?$/)
  // Wait for initial placeholder toggle to ensure page rendered
  await expect(page.getByTestId("pdp-wishlist-toggle").first()).toBeVisible({ timeout: 15000 })
  // Wait for toggle to appear (avoid strict data-ready gating due to streaming/hydration)
  const heartBtn = page
    .getByTestId("pdp-wishlist-toggle-button")
    .or(page.getByTestId("pdp-wishlist-toggle").getByRole("button").first())
  await expect(heartBtn).toBeVisible({ timeout: 60000 })
  await heartBtn.scrollIntoViewIfNeeded()
  await expect(heartBtn).toBeVisible({ timeout: 60000 })
  await expect(heartBtn).toBeEnabled({ timeout: 60000 })

  const before = await heartBtn.getAttribute("aria-pressed")
  await heartBtn.click()
  const expectedAfter = before === "true" ? "false" : "true"
  await expect(heartBtn).toHaveAttribute("aria-pressed", expectedAfter, { timeout: 5000 })
  // Restore to original state
  await heartBtn.click()
  await expect(heartBtn).toHaveAttribute("aria-pressed", String(before ?? "false"), {
    timeout: 5000,
  })
  // Toggle again and expect opposite of original
  await heartBtn.click()
  await expect
    .poll(async () => (await heartBtn.getAttribute("aria-pressed")) ?? "false")
    .toBe(expectedAfter)
})
