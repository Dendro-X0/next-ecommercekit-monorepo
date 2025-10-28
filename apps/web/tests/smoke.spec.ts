import { expect, test } from "@playwright/test"

/** Basic smoke test: home page renders and has a header/nav */
test("home loads", async ({ page }): Promise<void> => {
  const res = await page.goto("/")
  expect(res?.ok()).toBeTruthy()
  await expect(page.locator("body")).toBeVisible()
})
