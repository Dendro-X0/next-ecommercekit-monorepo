import type * as React from "react"

interface OrderRefundedEmailProps {
  readonly orderId: string
  readonly totalCents?: number
}

export default function OrderRefundedEmail({
  orderId,
  totalCents,
}: Readonly<OrderRefundedEmailProps>): React.ReactElement {
  const amount: string | null =
    typeof totalCents === "number"
      ? `$${Math.trunc(totalCents / 100)}.${Math.abs(totalCents % 100)
          .toString()
          .padStart(2, "0")}`
      : null
  return (
    <div>
      <h1>Refund processed</h1>
      <p>
        We processed your refund for order <strong>{orderId}</strong>.
      </p>
      {amount ? (
        <p>
          Amount: <strong>{amount}</strong>
        </p>
      ) : null}
    </div>
  )
}
