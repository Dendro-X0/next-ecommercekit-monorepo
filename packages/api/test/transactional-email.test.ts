import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock @react-email/render to avoid heavy rendering
vi.mock("@react-email/render", () => ({
  render: vi.fn(async (_el: unknown, opts?: { plainText?: boolean }) =>
    opts?.plainText ? "TEXT" : "HTML",
  ),
}))

// A controllable mock for Resend
const sendMock = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    public readonly emails: { send: (args: unknown) => Promise<unknown> }
    public constructor() {
      this.emails = { send: sendMock as (args: unknown) => Promise<unknown> }
    }
  },
}))

// Import after mocks
async function getMetric(kind: string, outcome: "success" | "failure"): Promise<number> {
  const { renderEmailMetrics } = await import("../src/lib/transactional-email")
  const text: string = renderEmailMetrics()
  const re = new RegExp(
    `^email_sends_total\\{kind=\\"${kind}\\",outcome=\\"${outcome}\\"\\} (\\d+)`,
    "m",
  )
  const m = text.match(re)
  return m ? Number(m[1]) : 0
}

async function withEnv<T>(
  fn: (mod: typeof import("../src/lib/transactional-email")) => Promise<T> | T,
): Promise<T> {
  const prevKey = process.env.RESEND_API_KEY
  const prevFrom = process.env.EMAIL_FROM
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "test_key"
  process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@example.com"
  vi.resetModules()
  const mod = await import("../src/lib/transactional-email")
  const result = await fn(mod)
  process.env.RESEND_API_KEY = prevKey
  process.env.EMAIL_FROM = prevFrom
  return result
}

describe("transactionalEmail retry & metrics", () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it("increments success metric on first try", async () =>
    withEnv(async ({ transactionalEmail }) => {
      sendMock.mockResolvedValueOnce({ id: "ok" })
      const before = await getMetric("orderCreated", "success")
      await transactionalEmail.orderCreated({
        email: "u@example.com",
        orderId: "o1",
        totalCents: 1234,
      })
      const after = await getMetric("orderCreated", "success")
      expect(after).toBe(before + 1)
      expect(sendMock).toHaveBeenCalledTimes(1)
    }))

  it("retries and records failure after 3 attempts", async () =>
    withEnv(async ({ transactionalEmail }) => {
      sendMock.mockRejectedValueOnce(new Error("net err #1"))
      sendMock.mockRejectedValueOnce(new Error("net err #2"))
      sendMock.mockRejectedValueOnce(new Error("net err #3"))
      const beforeFail = await getMetric("orderPaid", "failure")
      await transactionalEmail.orderPaid({ email: "u@example.com", orderId: "o2", totalCents: 999 })
      const afterFail = await getMetric("orderPaid", "failure")
      expect(afterFail).toBe(beforeFail + 1)
      expect(sendMock).toHaveBeenCalledTimes(3)
    }))

  it("succeeds on third attempt increments success once", async () =>
    withEnv(async ({ transactionalEmail }) => {
      sendMock.mockRejectedValueOnce(new Error("flaky #1"))
      sendMock.mockRejectedValueOnce(new Error("flaky #2"))
      sendMock.mockResolvedValueOnce({ id: "ok" })
      const beforeSucc = await getMetric("orderCancelled", "success")
      await transactionalEmail.orderCancelled({ email: "u@example.com", orderId: "o3" })
      const afterSucc = await getMetric("orderCancelled", "success")
      expect(afterSucc).toBe(beforeSucc + 1)
      expect(sendMock).toHaveBeenCalledTimes(3)
    }))
})
