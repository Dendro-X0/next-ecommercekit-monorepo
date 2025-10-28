import type * as React from "react"

/**
 * Order cancelled transactional email template.
 */
export interface OrderCancelledEmailProps {
  readonly orderId: string
  readonly totalCents?: number
}

export const OrderCancelledEmail: React.FC<Readonly<OrderCancelledEmailProps>> = ({
  orderId,
  totalCents,
}) => {
  const amount: string | null =
    typeof totalCents === "number"
      ? `$${Math.trunc(totalCents / 100)}.${Math.abs(totalCents % 100)
          .toString()
          .padStart(2, "0")}`
      : null
  return (
    <div>
      <h1>Order cancelled</h1>
      <p>
        Your order <strong>{orderId}</strong> has been cancelled.
      </p>
      {amount ? (
        <p>
          Total: <strong>{amount}</strong>
        </p>
      ) : null}
    </div>
  )
}
