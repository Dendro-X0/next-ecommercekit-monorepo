import type * as React from "react"

/**
 * Order created (confirmation) transactional email template.
 * Displays the order ID and optional total amount.
 */
interface OrderCreatedEmailProps {
  readonly orderId: string
  readonly totalCents?: number
}

/**
 * OrderCreatedEmail renders a minimal confirmation message for a newly created order.
 */
export const OrderCreatedEmail: React.FC<Readonly<OrderCreatedEmailProps>> = ({
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
