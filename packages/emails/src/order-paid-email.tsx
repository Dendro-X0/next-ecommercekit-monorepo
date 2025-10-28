import type * as React from "react"

interface OrderPaidEmailProps {
  readonly orderId: string
  readonly totalCents?: number
}

export default function OrderPaidEmail({
  orderId,
  totalCents,
}: Readonly<OrderPaidEmailProps>): React.ReactElement {
  const amount: string | null =
    typeof totalCents === "number"
      ? `$${Math.trunc(totalCents / 100)}.${Math.abs(totalCents % 100)
          .toString()
          .padStart(2, "0")}`
      : null
  return (
    <div>
      <h1>Payment confirmed</h1>
      <p>
        Your payment for order <strong>{orderId}</strong> has been received.
      </p>
      {amount ? (
        <p>
          Total: <strong>{amount}</strong>
        </p>
      ) : null}
    </div>
  )
}
