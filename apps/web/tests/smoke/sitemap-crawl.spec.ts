import { test, expect } from "@playwright/test"
import { fetchSitemapUrls } from "../utils/sitemap"

// Tag: @smoke
// Crawls sitemap URLs, visits each page, and records console errors/network failures.

test.describe("sitemap smoke", () => {
  test("crawl sitemap @smoke", async ({ page, baseURL }, testInfo) => {
    const base = baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001"
    const urls = await fetchSitemapUrls(base)
    testInfo.attach("sitemap-count", { body: String(urls.length), contentType: "text/plain" })

    const failures: Array<{ url: string; error: string }> = []

    for (const url of urls) {
      const messages: string[] = []
      page.on("console", (msg) => {
        if (msg.type() === "error") messages.push(`[console] ${msg.text()}`)
      })
      page.on("pageerror", (err) => messages.push(`[pageerror] ${err.message}`))
      page.on("requestfailed", (req) => {
        const err = req.failure()?.errorText ?? "fail"
        // Ignore aborted requests caused by route transitions/streaming
        if (err.includes("ERR_ABORTED")) return
        messages.push(`[requestfailed] ${req.url()} ${err}`)
      })

      try {
        const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
        // Allow some time for client JS to settle; avoid hard failures on streamed routes
        try { await page.waitForSelector('#main-content, body', { timeout: 5000 }) } catch {}
        try { await page.waitForLoadState('networkidle', { timeout: 5000 }) } catch {}
        expect(res?.ok(), `HTTP status for ${url}`).toBeTruthy()
        if (messages.length) {
          failures.push({ url, error: messages.join("\n") })
          await page.screenshot({ path: testInfo.outputPath(`fail-${encodeURIComponent(url)}.png`) })
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        failures.push({ url, error: msg })
        await page.screenshot({ path: testInfo.outputPath(`error-${encodeURIComponent(url)}.png`) })
      }
    }

    if (failures.length) {
      await testInfo.attach("smoke-failures.json", {
        body: JSON.stringify(failures, null, 2),
        contentType: "application/json",
      })
    }
    expect(failures, `No crawl failures expected. See smoke-failures.json if present`).toHaveLength(0)
  })
})
