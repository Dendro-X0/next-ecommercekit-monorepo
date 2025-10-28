import type * as React from "react"

interface OrderCreatedEmailProps {
  readonly orderId: string
  readonly totalCents?: number
}

export default function OrderCreatedEmail({
  orderId,
  totalCents,
}: Readonly<OrderCreatedEmailProps>): React.ReactElement {
  const amount: string | null =
    typeof totalCents === "number"
      ? `$${Math.trunc(totalCents / 100)}.${Math.abs(totalCents % 100)
          .toString()
          .padStart(2, "0")}`
      : null
  return (
    <div>
      <h1>Thanks for your order</h1>
      <p>
        Your order <strong>{orderId}</strong> has been received.
      </p>
      {amount ? (
        <p>
          Total: <strong>{amount}</strong>
        </p>
      ) : null}
    </div>
  )
}
