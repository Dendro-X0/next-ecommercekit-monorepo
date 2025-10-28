import { expect, test } from "@playwright/test"

/**
 * Header wishlist badge smoke test:
 * - Go to home, expect the wishlist link in header.
 * - Badge may be hidden (no items) or visible with a number.
 */
test("header shows wishlist link and optional badge", async ({ page }): Promise<void> => {
  await page.goto("/")
  const link = page.getByTestId("header-wishlist-link")
  await expect(link).toBeVisible({ timeout: 60000 })

  const badge = page.getByTestId("header-wishlist-badge")
  // Badge presence is optional; when present, it should either be hidden (display: none) or a number.
  // We avoid strict count assertion to keep this deterministic without data setup.
  const isVisible = await badge.isVisible().catch(() => false)
  if (isVisible) {
    const txt = (await badge.textContent())?.trim() ?? ""
    expect(/^[0-9]+$/.test(txt)).toBeTruthy()
  }
})
